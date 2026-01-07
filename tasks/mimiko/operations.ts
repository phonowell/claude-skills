import { join } from 'node:path'

import {
  clean,
  copy,
  echo,
  getName,
  glob,
  normalizePath,
  prompt,
} from 'fire-keeper'
import { trim } from 'radash'

import { getFileLines, getFileTime } from './utils.js'

export type SyncAction = 'local -> remote' | 'local <- remote' | 'skip'

/** 提示选择同步操作 */
export const promptAction = async (
  local: string,
  remote: string,
): Promise<SyncAction> => {
  const [localTime, remoteTime, localLines, remoteLines] = await Promise.all([
    getFileTime(local),
    getFileTime(remote),
    getFileLines(local),
    getFileLines(remote),
  ])

  const options: Array<{ title: string; value: SyncAction }> = []

  if (localTime > 0) {
    const isNewer = localTime > remoteTime
    const lineInfo =
      isNewer && localLines > 0 && remoteLines > 0
        ? ` (newer, ${remoteLines}L -> ${localLines}L)`
        : ''
    options.push({
      title: `local -> remote${lineInfo}`,
      value: 'local -> remote',
    })
  }
  if (remoteTime > 0) {
    const isNewer = remoteTime > localTime
    const lineInfo =
      isNewer && localLines > 0 && remoteLines > 0
        ? ` (newer, ${localLines}L -> ${remoteLines}L)`
        : ''
    options.push({
      title: `local <- remote${lineInfo}`,
      value: 'local <- remote',
    })
  }

  if (options.length === 0) {
    echo('**skip**')
    return 'skip'
  }

  const defaultIndex = options.findIndex((opt) => opt.title.includes('(newer)'))
  options.push({ title: 'skip', value: 'skip' })

  return prompt({
    type: 'select',
    message: 'and you decide to...',
    list: options,
    default: defaultIndex,
  })
}

/** 覆盖文件 */
export const overwriteFile = async (
  action: SyncAction,
  local: string,
  remote: string,
) => {
  const pathToUse = action === 'local -> remote' ? remote : local
  const { dirname, filename } = getName(pathToUse)
  const sourceFile = action === 'local -> remote' ? local : remote

  await copy(sourceFile, dirname, filename)
}

/** 执行删除操作 */
export const executeDelete = async (
  base: string,
  line: string,
  targetBasePath: string,
) => {
  // 去掉开头的 /，然后解析命令和路径
  const cleanLine = line.startsWith('/') ? line.slice(1) : line
  const parts = cleanLine.split(/\s+/).map((it) => trim(it, ' /'))
  const [command, path] = parts
  if (command !== 'rm') return

  const cwd = process.cwd()
  const sourceBase = normalizePath(join(cwd, base))
  const targetBase = normalizePath(join(cwd, targetBasePath, base))

  const sourcePath = join(sourceBase, path)
  const targetPath = join(targetBase, path)

  const [sourceFiles, targetFiles] = await Promise.all([
    glob(sourcePath),
    glob(targetPath),
  ])

  const totalFiles = sourceFiles.length + targetFiles.length
  if (totalFiles === 0) return

  const confirmed = await prompt({
    type: 'confirm',
    message: `confirm to remove ${sourceFiles.length} item(s) from source and ${targetFiles.length} item(s) from target matching **${path}**?`,
    default: true,
  })

  if (confirmed) {
    for (const file of sourceFiles) await clean(file)
    for (const file of targetFiles) await clean(file)
  }
}
