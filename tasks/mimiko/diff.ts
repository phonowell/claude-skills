import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'

const CONTEXT_LINES = 2

export const showFileDiff = async (
  sourcePath: string,
  targetPath: string,
): Promise<void> => {
  const [sourceContent, targetContent] = await Promise.all([
    readFile(sourcePath, 'utf-8').catch(() => ''),
    readFile(targetPath, 'utf-8').catch(() => ''),
  ])

  if (!sourceContent && !targetContent) return

  const cwd = process.cwd()
  const relSource = relative(cwd, sourcePath)
  const relTarget = relative(cwd, targetPath)

  console.log('')
  console.log(`\x1b[36m--- ${relTarget}\x1b[0m`)
  console.log(`\x1b[36m+++ ${relSource}\x1b[0m`)

  const sourceLines = sourceContent.split('\n')
  const targetLines = targetContent.split('\n')

  const diffs = simpleDiff(targetLines, sourceLines)
  for (const diff of diffs) console.log(diff)
}

const simpleDiff = (oldLines: string[], newLines: string[]): string[] => {
  const chunks: Array<{
    type: 'same' | 'delete' | 'add'
    lines: string[]
  }> = []

  let i = 0
  let j = 0

  while (i < oldLines.length || j < newLines.length) {
    const sameLines: string[] = []

    while (
      i < oldLines.length &&
      j < newLines.length &&
      oldLines[i] === newLines[j]
    ) {
      sameLines.push(oldLines[i])
      i++
      j++
    }

    if (sameLines.length > 0) chunks.push({ type: 'same', lines: sameLines })

    const deleteLines: string[] = []
    while (
      i < oldLines.length &&
      (j >= newLines.length || oldLines[i] !== newLines[j])
    ) {
      deleteLines.push(oldLines[i])
      i++
    }

    if (deleteLines.length > 0)
      chunks.push({ type: 'delete', lines: deleteLines })

    const addLines: string[] = []
    while (
      j < newLines.length &&
      (i >= oldLines.length || oldLines[i] !== newLines[j])
    ) {
      addLines.push(newLines[j])
      j++
    }

    if (addLines.length > 0) chunks.push({ type: 'add', lines: addLines })
  }

  const result: string[] = []
  const diffIndices = chunks
    .map((chunk, idx) => (chunk.type !== 'same' ? idx : -1))
    .filter((idx) => idx !== -1)

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx]
    const isNearDiff = diffIndices.some((di) => Math.abs(di - idx) <= 1)

    if (chunk.type === 'same' && isNearDiff) {
      const contextLines = chunk.lines.slice(-CONTEXT_LINES)
      result.push(...contextLines.map((line) => ` ${line}`))
    } else if (chunk.type !== 'same') {
      const color = chunk.type === 'delete' ? '\x1b[31m' : '\x1b[32m'
      const prefix = chunk.type === 'delete' ? '-' : '+'
      result.push(
        ...chunk.lines.map((line) => `${color}${prefix}${line}\x1b[0m`),
      )
    }
  }

  return result
}

export const areFilesDifferent = async (
  sourcePath: string,
  targetPath: string,
): Promise<boolean> => {
  const [sourceContent, targetContent] = await Promise.all([
    readFile(sourcePath, 'utf-8').catch(() => ''),
    readFile(targetPath, 'utf-8').catch(() => ''),
  ])

  return sourceContent !== targetContent
}
