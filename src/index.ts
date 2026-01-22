import {
  echo,
  getName,
  glob,
  home,
  mkdir,
  normalizePath,
  remove,
} from 'fire-keeper'

import type { Stats } from 'node:fs'

const LOCAL_PATH = './skills'
const IS_TEST = Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test'

type SkillFolder = {
  name: string
  source: string
}

type Lstat = (path: string) => Promise<Stats>
type Readlink = (path: string) => Promise<string>
type Symlink = (
  target: string,
  path: string,
  type?: 'junction' | undefined,
) => Promise<void>
type Stat = (path: string) => Promise<Stats>

const listSkillFolders = async (): Promise<SkillFolder[]> => {
  const folders = await glob(`${LOCAL_PATH}/*`, { onlyDirectories: true })
  return folders
    .map((folder) => {
      const { filename } = getName(folder)
      return { name: filename, source: normalizePath(folder) }
    })
    .filter((folder) => folder.name && !folder.name.startsWith('.'))
}

const normalizeLinkPath = (value: string) => {
  const normalized = normalizePath(value)
  if (process.platform !== 'win32') return normalized
  const withoutUncPrefix = normalized.replace(/^\/\/\?\/UNC\//i, '//')
  const withoutPrefix = withoutUncPrefix.replace(/^\/\/\?\//i, '')
  return withoutPrefix.toLowerCase()
}

const ensureSkillsRoot = async (targetRoot: string, lstat: Lstat) => {
  try {
    const rootStat = await lstat(targetRoot)
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      await remove(targetRoot)
      await mkdir(targetRoot)
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    await mkdir(targetRoot)
  }
}

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
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
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
    onlyDirectories: false,
    onlyFiles: false,
    followSymbolicLinks: false,
  })

  for (const entry of entries) {
    const { filename } = getName(entry)
    if (!filename || filename.startsWith('.')) continue

    let entryStat: Stats
    try {
      entryStat = await lstat(entry)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw err
    }

    if (!entryStat.isSymbolicLink()) continue

    try {
      await stat(entry)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
      await remove(entry)
      echo(`Removed broken link **${entry}**`)
    }
  }
}

const linkSkills = async () => {
  const skillFolders = await listSkillFolders()

  const targetRoots = [
    `${home()}/.claude/skills`,
    `${home()}/.codex/skills`,
    `${home()}/.trae-cn/skills`,
    `${home()}/.cursor/skills`,
  ]
  const linkType: 'junction' | undefined =
    process.platform === 'win32' ? 'junction' : undefined
  const { lstat, readlink, symlink, stat } = await import('node:fs/promises')

  for (const targetRoot of targetRoots) {
    await ensureSkillsRoot(targetRoot, lstat)
    await cleanupBrokenSymlinks(targetRoot, lstat, stat)

    for (const folder of skillFolders) {
      const targetPath = `${targetRoot}/${folder.name}`
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

const main = async () => {
  await linkSkills()
}

if (!IS_TEST) main()

export { linkSkills }
export default main
