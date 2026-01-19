import { copy, echo, getName, glob, home, isSame, stat } from 'fire-keeper'

import { overwriteFile, promptAction } from '../tasks/mimiko/operations.js'

const LOCAL_PATH = 'skills'
const REMOTE_PATH = '~/.claude/skills'
const IGNORE_PATTERNS = ['.DS_Store', 'settings.local.json']

const shouldIgnore = (filePath: string): boolean =>
  IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern))

const collectAllFiles = async (
  base: string,
  baseName: string,
): Promise<Set<string>> => {
  const files = await glob(`${base}/**/*`)
  const filtered = []
  for (const file of files) {
    if (shouldIgnore(file)) continue
    const result = await stat(file)
    if (!result?.isFile()) continue

    const parts = file.split(`/${baseName}/`)
    if (parts.length <= 1) continue
    filtered.push(parts[1])
  }
  return new Set(filtered)
}

const syncFile = async (
  localPath: string | null,
  remotePath: string | null,
) => {
  if (localPath && remotePath) {
    const localFullPath = `./${LOCAL_PATH}/${localPath}`
    const remoteFileFullPath = `${REMOTE_PATH}/${remotePath}`

    if (await isSame([localFullPath, remoteFileFullPath])) return

    echo(`**${localFullPath}** is different from **${remoteFileFullPath}**`)

    const action = await promptAction(localFullPath, remoteFileFullPath)
    if (action === 'skip') return

    await overwriteFile(action, localFullPath, remoteFileFullPath)
    return
  }

  if (localPath) {
    const localFullPath = `./${LOCAL_PATH}/${localPath}`
    echo(`New local file: **${localFullPath}**`)
    const action = await promptAction(localFullPath, '')
    if (action === 'skip') return

    const remoteFile = `${REMOTE_PATH}/${localPath}`
    const { dirname, filename } = getName(remoteFile)

    await copy(localFullPath, dirname, filename)
    return
  }

  if (remotePath) {
    const remoteFileFullPath = `${REMOTE_PATH}/${remotePath}`
    echo(`New remote file: **${remoteFileFullPath}**`)
    const action = await promptAction('', remoteFileFullPath)
    if (action === 'skip') return

    const localFile = `./${LOCAL_PATH}/${remotePath}`
    const { dirname, filename } = getName(localFile)

    await copy(remoteFileFullPath, dirname, filename)
  }
}

const linkSkills = async () => {
  const source = `${home()}/.claude/skills`
  const targets = [`${home()}/.codex/skills`, `${home()}/.trae-cn/skills`]
  const { lstat, readlink, rename, symlink, unlink } =
    await import('node:fs/promises')

  for (const target of targets) {
    let needRelink = false
    try {
      const targetStat = await lstat(target)
      if (targetStat.isSymbolicLink()) {
        const existingSource = await readlink(target)
        if (existingSource === source) {
          echo(`Skip **${target}** -> **${source}** (already linked)`)
          continue
        }
        await unlink(target)
        needRelink = true
      } else {
        await unlink(target)
        needRelink = true
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }

    try {
      await symlink(source, target)
      echo(`Linked **${target}** -> **${source}**`)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST' && needRelink) {
        const backup = `${target}.bak.${Date.now()}`
        await rename(target, backup)
        await symlink(source, target)
        echo(
          `Moved **${target}** to **${backup}**, linked **${target}** -> **${source}**`,
        )
      } else throw err
    }
  }
}

const main = async () => {
  const localFiles = await collectAllFiles(`./${LOCAL_PATH}`, LOCAL_PATH)
  const remoteFiles = await collectAllFiles(REMOTE_PATH, '.claude/skills')

  const allPaths = new Set([...localFiles, ...remoteFiles])

  for (const path of allPaths) {
    const localPath = localFiles.has(path) ? path : null
    const remotePath = remoteFiles.has(path) ? path : null

    await syncFile(localPath, remotePath)
  }

  await linkSkills()
}

main()

export default main
