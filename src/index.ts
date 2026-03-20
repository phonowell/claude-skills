import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

import {
  echo,
  getName,
  glob,
  home,
  mkdir,
  normalizePath,
  remove,
} from 'fire-keeper'

import syncUpstreamSkills from '../tasks/upstream-skills.js'

import type { Stats } from 'node:fs'

const LOCAL_PATH = './skills'
const IS_TEST = Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test'

type SkillLocation = 'external' | 'local'

type ProjectSkillFolder = {
  location: SkillLocation
  name: string
  source: string
}

type ImportState = {
  blockedTargets: Set<string>
  rootsBySkill: Map<string, Set<string>>
}

type Lstat = (path: string) => Promise<Stats>
type Readlink = (path: string) => Promise<string>
type Symlink = (
  target: string,
  path: string,
  type?: 'junction' | undefined,
) => Promise<void>
type Stat = (path: string) => Promise<Stats>

const DEFAULT_ROOTS = [
  '.claude/skills',
  '.codex/skills',
  '.trae-cn/skills',
  '.cursor/skills',
]

const EXTRA_ROOTS_BY_SKILL = new Map<string, string[]>([
  ['openai-docs', ['.codex/skills/.system']],
  ['skill-creator', ['.claude/skills/.system', '.codex/skills/.system']],
  ['skill-installer', ['.claude/skills/.system', '.codex/skills/.system']],
])

const MANAGED_ROOTS = Array.from(
  new Set([
    ...DEFAULT_ROOTS,
    '.agents/skills',
    ...Array.from(EXTRA_ROOTS_BY_SKILL.values()).flat(),
  ]),
)

const SYSTEM_ONLY_SKILLS = new Set(['openai-docs', 'skill-installer'])
const SYSTEM_ROOT_SUFFIX = '/.system'

const getErrorCode = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof Reflect.get(error, 'code') === 'string'
  )
    return Reflect.get(error, 'code')

  return ''
}

const getTargetKey = (root: string, name: string) => `${root}:${name}`

const getLocalSkillPath = (name: string) =>
  normalizePath(`${LOCAL_PATH}/local/${name}`)

const registerRoot = (
  rootsBySkill: Map<string, Set<string>>,
  name: string,
  root: string,
) => {
  const roots = rootsBySkill.get(name) ?? new Set<string>()
  roots.add(root)
  rootsBySkill.set(name, roots)
}

const listProjectSkillFolders = async (): Promise<ProjectSkillFolder[]> => {
  const [localFolders, externalSkillFiles] = await Promise.all([
    glob(`${LOCAL_PATH}/local/*`, { onlyDirectories: true }),
    glob(`${LOCAL_PATH}/external/**/SKILL.md`, { onlyFiles: true }),
  ])

  const externalFolders = Array.from(
    new Set(externalSkillFiles.map((file) => normalizePath(dirname(file)))),
  )

  return [
    ...localFolders.map((folder) => ({
      location: 'local' as const,
      name: getName(folder).filename,
      source: normalizePath(folder),
    })),
    ...externalFolders.map((folder) => ({
      location: 'external' as const,
      name: getName(folder).filename,
      source: normalizePath(folder),
    })),
  ].filter((folder) => folder.name && !folder.name.startsWith('.'))
}

const normalizeLinkPath = (value: string) => {
  const normalized = normalizePath(value)
  if (process.platform !== 'win32') return normalized
  const withoutUncPrefix = normalized.replace(/^\/\/\?\/UNC\//i, '//')
  const withoutPrefix = withoutUncPrefix.replace(/^\/\/\?\//i, '')
  return withoutPrefix.toLowerCase()
}

const isPathPresent = async (targetPath: string, lstat: Lstat) => {
  try {
    await lstat(targetPath)
    return true
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') return false
    throw error
  }
}

const findExistingExternalSkillPath = async (name: string, lstat: Lstat) => {
  const directSkillFile = normalizePath(
    `${LOCAL_PATH}/external/${name}/SKILL.md`,
  )
  if (await isPathPresent(directSkillFile, lstat))
    return normalizePath(dirname(directSkillFile))

  const nestedSkillFiles = await glob(
    `${LOCAL_PATH}/external/**/${name}/SKILL.md`,
    {
      onlyFiles: true,
    },
  )

  const [firstSkillFile] = nestedSkillFiles
  return firstSkillFile ? normalizePath(dirname(firstSkillFile)) : ''
}

const resolveProjectSkillPath = async (
  name: string,
  location: SkillLocation,
  lstat: Lstat,
) => {
  if (location === 'local') return getLocalSkillPath(name)

  const existingExternalPath = await findExistingExternalSkillPath(name, lstat)
  if (existingExternalPath) return existingExternalPath

  return normalizePath(`${LOCAL_PATH}/external/${name}`)
}

const getLocationByName = async (
  name: string,
  root: string,
  lstat: Lstat,
): Promise<SkillLocation> => {
  if (root.endsWith(SYSTEM_ROOT_SUFFIX)) return 'external'
  if (await isPathPresent(getLocalSkillPath(name), lstat)) return 'local'
  if (await findExistingExternalSkillPath(name, lstat)) return 'external'
  return 'external'
}

const ensureSkillsRoot = async (targetRoot: string, lstat: Lstat) => {
  try {
    const rootStat = await lstat(targetRoot)
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      await remove(targetRoot)
      await mkdir(targetRoot)
    }
  } catch (error) {
    if (getErrorCode(error) !== 'ENOENT') throw error
    await mkdir(targetRoot)
  }
}

const isSystemRoot = (root: string) => root.endsWith(SYSTEM_ROOT_SUFFIX)

const linkSkillFolder = async (
  sourcePath: string,
  targetPath: string,
  lstat: Lstat,
  readlink: Readlink,
  symlink: Symlink,
  linkType: 'junction' | undefined,
) => {
  try {
    const targetStat = await lstat(targetPath)
    if (targetStat.isSymbolicLink()) {
      const existingSource = await readlink(targetPath)
      if (normalizeLinkPath(existingSource) === normalizeLinkPath(sourcePath))
        return
    }
    await remove(targetPath)
  } catch (error) {
    if (getErrorCode(error) !== 'ENOENT') throw error
  }

  await symlink(sourcePath, targetPath, linkType)
  echo(`Linked **${targetPath}** -> **${sourcePath}**`)
}

const cleanupBrokenSymlinks = async (
  targetRoot: string,
  lstat: Lstat,
  stat: Stat,
) => {
  const entries = await glob(`${targetRoot}/*`, {
    followSymbolicLinks: false,
    onlyDirectories: false,
    onlyFiles: false,
  })

  for (const entry of entries) {
    const { filename } = getName(entry)
    if (!filename || filename.startsWith('.')) continue

    let entryStat: Stats
    try {
      entryStat = await lstat(entry)
    } catch (error) {
      if (getErrorCode(error) === 'ENOENT') continue
      throw error
    }

    if (!entryStat.isSymbolicLink()) continue

    try {
      await stat(entry)
    } catch (error) {
      if (getErrorCode(error) !== 'ENOENT') throw error
      await remove(entry)
      echo(`Removed broken link **${entry}**`)
    }
  }
}

const getDirectorySignature = async (
  dirPath: string,
  basePath = dirPath,
): Promise<string[]> => {
  const entries = (await readdir(dirPath, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )

  const signatures: string[] = []

  for (const entry of entries) {
    const absolutePath = join(dirPath, entry.name)
    const relativePath = normalizePath(relative(basePath, absolutePath))

    if (entry.isDirectory()) {
      signatures.push(`dir:${relativePath}`)
      signatures.push(...(await getDirectorySignature(absolutePath, basePath)))
      continue
    }

    if (entry.isSymbolicLink()) {
      const { readlink } = await import('node:fs/promises')
      const target = await readlink(absolutePath)
      signatures.push(`link:${relativePath}:${normalizeLinkPath(target)}`)
      continue
    }

    const content = await readFile(absolutePath)
    const hash = createHash('sha1').update(content).digest('hex')
    signatures.push(`file:${relativePath}:${hash}`)
  }

  return signatures
}

const isSameDirectory = async (leftPath: string, rightPath: string) => {
  try {
    const [left, right] = await Promise.all([
      getDirectorySignature(leftPath),
      getDirectorySignature(rightPath),
    ])

    if (left.length !== right.length) return false
    return left.every((line, index) => line === right[index])
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') return false
    throw error
  }
}

const hasSkillDefinition = (dirPath: string, lstat: Lstat) =>
  isPathPresent(normalizePath(`${dirPath}/SKILL.md`), lstat)

const moveDirectory = async (sourcePath: string, targetPath: string) => {
  const { cp, rename, rm } = await import('node:fs/promises')
  await mkdir(dirname(targetPath))

  try {
    await rename(sourcePath, targetPath)
    return
  } catch (error) {
    if (getErrorCode(error) !== 'EXDEV') throw error
  }

  await cp(sourcePath, targetPath, { force: true, recursive: true })
  await rm(sourcePath, { force: true, recursive: true })
}

const collectGlobalState = async (
  lstat: Lstat,
  stat: Stat,
): Promise<ImportState> => {
  const state: ImportState = {
    blockedTargets: new Set<string>(),
    rootsBySkill: new Map<string, Set<string>>(),
  }

  for (const root of MANAGED_ROOTS) {
    const targetRoot = normalizePath(`${home()}/${root}`)
    await ensureSkillsRoot(targetRoot, lstat)
    await cleanupBrokenSymlinks(targetRoot, lstat, stat)

    const entries = await glob(`${targetRoot}/*`, {
      followSymbolicLinks: false,
      onlyDirectories: false,
      onlyFiles: false,
    })

    for (const entry of entries) {
      const { filename } = getName(entry)
      if (!filename || filename.startsWith('.')) continue

      let entryStat: Stats
      try {
        entryStat = await lstat(entry)
      } catch (error) {
        if (getErrorCode(error) === 'ENOENT') continue
        throw error
      }

      registerRoot(state.rootsBySkill, filename, root)

      if (entryStat.isSymbolicLink() || !entryStat.isDirectory()) continue

      const location = await getLocationByName(filename, root, lstat)
      const destination = await resolveProjectSkillPath(
        filename,
        location,
        lstat,
      )

      if (await isPathPresent(destination, lstat)) {
        if (await isSameDirectory(entry, destination)) {
          await remove(entry)
          echo(`Removed duplicated global skill **${entry}**`)
          continue
        }

        if (
          root === '.agents/skills' &&
          (await hasSkillDefinition(entry, lstat)) &&
          (await hasSkillDefinition(destination, lstat))
        ) {
          await remove(entry)
          echo(`Reclaimed managed skill **${entry}** -> **${destination}**`)
          continue
        }

        if (isSystemRoot(root)) {
          await remove(entry)
          echo(`Replaced system skill **${entry}** -> **${destination}**`)
          continue
        }

        state.blockedTargets.add(getTargetKey(root, filename))
        echo(`Conflict importing **${entry}** -> **${destination}**`)
        continue
      }

      await moveDirectory(entry, destination)
      echo(`Imported **${entry}** -> **${destination}**`)
    }
  }

  return state
}

const getRootsForSkill = (
  name: string,
  rootsBySkill: Map<string, Set<string>>,
) => {
  const roots = new Set<string>()

  if (!SYSTEM_ONLY_SKILLS.has(name))
    for (const root of DEFAULT_ROOTS) roots.add(root)

  for (const root of EXTRA_ROOTS_BY_SKILL.get(name) ?? []) roots.add(root)
  for (const root of rootsBySkill.get(name) ?? []) roots.add(root)

  return Array.from(roots)
}

const linkSkills = async (state: ImportState) => {
  const skillFolders = await listProjectSkillFolders()
  const linkType: 'junction' | undefined =
    process.platform === 'win32' ? 'junction' : undefined
  const { lstat, readlink, symlink, stat } = await import('node:fs/promises')

  for (const root of MANAGED_ROOTS) {
    await ensureSkillsRoot(normalizePath(`${home()}/${root}`), lstat)
    await cleanupBrokenSymlinks(normalizePath(`${home()}/${root}`), lstat, stat)
  }

  for (const folder of skillFolders) {
    const roots = getRootsForSkill(folder.name, state.rootsBySkill)

    for (const root of roots) {
      if (state.blockedTargets.has(getTargetKey(root, folder.name))) continue

      const targetPath = normalizePath(`${home()}/${root}/${folder.name}`)
      await linkSkillFolder(
        folder.source,
        targetPath,
        lstat,
        readlink,
        symlink,
        linkType,
      )
    }
  }
}

const manageSkills = async (
  syncExternalSkills: () => Promise<void> = syncUpstreamSkills,
) => {
  const { lstat, stat } = await import('node:fs/promises')
  const state = await collectGlobalState(lstat, stat)
  await linkSkills(state)
  await syncExternalSkills()
}

const main = async () => {
  await manageSkills()
}

if (!IS_TEST) main()

export { linkSkills, manageSkills }
export default main
