import { exec, read, remove, write } from 'fire-keeper'

const removeDeps = async () => {
  type Pkg = {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const pkg = await read<Pkg>('./package.json')
  if (!pkg) return

  const deps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ].filter((name) => {
    if (name.includes('apollo')) return true
    if (name.includes('graphql')) return true
    if (name.includes('h5-manga-base')) return true
    return false
  })

  if (!deps.length) return
  await exec(`pnpm rm ${deps.join(' ')}`)
}

const removeUseless = () =>
  remove(['./codegen.yml', './src/__generated__', './src/operation.graphql'])

const rewriteConst = async () => {
  const CONST_PATH = './src/includes/const.ts'

  const content = await read(CONST_PATH)
  if (!content) return

  if (content.includes('declare global')) return

  const result = [
    'declare global {',
    '  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions',
    '  interface Window {',
    '    ActivityID: number',
    '    MangaActivityID: number',
    '  }',
    '}',
    '',
    content,
  ].join('\n')

  if (result === content) return
  await write(CONST_PATH, result)
}

const rewriteEntry = async () => {
  const ENTRY_PATH = './src/App.tsx'

  const content = await read(ENTRY_PATH)
  if (!content) return

  const result = content
    .replace("import { Provider } from '@bilibili-firebird/lib.apollo'", '')
    .replace("import init from '@plat-components/h5-manga-base'", '')
    .replace('// have to init before render when using mock', '')
    .replace('// to make sure the provider of wd40 is ready', '')
    .replace('if (IS_DEBUG) init({})', '')
    .replace('<Provider>', '<>')
    .replace('</Provider>', '</>')

  if (result === content) return
  await write(ENTRY_PATH, result)
}

const main = async () => {
  await removeDeps()
  await rewriteEntry()
  await rewriteConst()
  await removeUseless()
}

export default main
