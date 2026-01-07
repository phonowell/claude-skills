import { exec, glob, read, runConcurrent, write } from 'fire-keeper'

const LOG_PATTERNS = [
  /console\.(log|debug|info|warn|error|trace|table|dir|dirxml|assert|count|countReset|group|groupCollapsed|groupEnd|time|timeEnd|timeLog|profile|profileEnd|clear)\([^)]*\)/g,
] as const

const child = async (source: string) => {
  const raw = await read(source)
  if (!raw) return

  const content = raw.toString()
  if (!content) return

  let result = content
  for (const pattern of LOG_PATTERNS) result = result.replace(pattern, '')

  // 清理空行（多个连续空行替换为单个空行）
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n')

  if (result === content) return

  await write(source, result)
  return source
}

const listSources = () =>
  glob(['./src/**/*.ts', './src/**/*.tsx', '!**/*.d.ts'])

const main = async () => {
  const list = await listSources()
  if (!list.length) return

  const changedFiles = (
    await runConcurrent(
      5,
      list.map((it) => () => child(it)),
    )
  ).filter(Boolean) as string[]

  if (!changedFiles.length) return
  await exec(`npx eslint --fix ${changedFiles.join(' ')}`)
}

export default main
