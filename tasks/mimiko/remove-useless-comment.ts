import { exec, glob, read, runConcurrent, write } from 'fire-keeper'

const TAGS = [
  '// component',
  '// effect',
  '// export',
  '// function',
  '// interface',
  '// render',
  '// variable',
] as const

const child = async (source: string) => {
  const raw = await read(source)
  if (!raw) return

  const content = raw.toString()
  if (!content) return

  const list = content
    .split('\n')
    .filter((line) => !TAGS.some((tag) => line.trim().startsWith(tag)))

  const result = list.join('\n')
  if (result === content) return

  await write(source, result)
  return source
}

const listSources = () =>
  glob(['./src/**/*.ts', './src/**/*.tsx', './tasks/**/*.ts', '!**/*.d.ts'])

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
