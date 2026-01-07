import { copy, echo, getName, glob, isSame, stat } from 'fire-keeper'

import { overwriteFile, promptAction } from '../tasks/mimiko/operations.js'

const LOCAL_PATH = 'skills'
const REMOTE_PATH = '~/.claude/skills'
const IGNORE_PATTERNS = ['.DS_Store']

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

const main = async () => {
  const localFiles = await collectAllFiles(`./${LOCAL_PATH}`, LOCAL_PATH)
  const remoteFiles = await collectAllFiles(REMOTE_PATH, '.claude/skills')

  const allPaths = new Set([...localFiles, ...remoteFiles])

  for (const path of allPaths) {
    const localPath = localFiles.has(path) ? path : null
    const remotePath = remoteFiles.has(path) ? path : null

    await syncFile(localPath, remotePath)
  }
}

main()

export default main
