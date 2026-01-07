import { exec, read, remove, runConcurrent, write } from 'fire-keeper'

type ApiInfo = Record<
  string,
  {
    desc: string
    name: string
    ref: string
  }[]
>

type DocInfo = {
  name: string
  desc: string
  req: string
  res: string
  url: string
}

const DEFAULT_BRANCH = 'master'
const OPTIONAL_PATTERN = /不传|不填|可选|选传|选填|非必传|非必填/
const CONFIG_PATH = './api.yaml'

/** Capitalize first letter */
const cap = (input: string) =>
  `${input.charAt(0).toUpperCase()}${input.slice(1)}`

const decode = (str: string) =>
  str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")

/** Fetch documentation and generate type definitions */
const fetchDoc = async (name: string, branch: string) => {
  const url = `http://comic.bilibili.co/api-doc/sniper/${branch}/${name
    .split('.')
    .map((it) => it.toLowerCase())
    .join('/')}.html`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `Fetch error: ${url} - Status: ${res.status} ${res.statusText}`,
    )
  }

  const html = await res.text()
  const sections = html.split(/<h2[^>]*>/).slice(1)

  return sections
    .map((section) => {
      const nameMatch = RegExp(/^([^<]+)/).exec(section)
      const name = nameMatch?.[1]?.trim() ?? ''

      const descMatch = RegExp(/<p[^>]*>([\s\S]*?)<\/p>/).exec(section)
      const desc = descMatch?.[1]
        ? decode(descMatch[1].replace(/<[^>]+>/g, '').trim())
        : ''

      const codeBlocks =
        section.match(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g) ?? []
      const req = codeBlocks[0]
        ? decode(codeBlocks[0].replace(/<[^>]+>/g, '').trim())
        : ''
      const res = codeBlocks[1]
        ? decode(codeBlocks[1].replace(/<[^>]+>/g, '').trim())
        : ''

      const docInfo = {
        name,
        desc,
        req,
        res,
        url: `${url}#${name.toLowerCase().replace(/\./g, '').replace(/\//g, '')}`,
      }

      return genType(docInfo)
    })
    .join('')
    .trim()
}

/** Format type definition string */
const formatType = (input: string) =>
  input
    // [{ ... }] -> { ... }[]
    .replace(/: \[{/g, ': {')
    .replace(/}],/g, '}[],')
    // {} -> Record<string, never>
    .replace(/{}/g, 'Record<string, never>')
    // bool -> boolean
    .replace(/false, \/\/ type<bool>/g, 'boolean //')
    // i32 -> number
    .replace(/0, \/\/ type<int32>/g, 'number //')
    // i64 -> `${bigint}`

    .replace(/"0", \/\/ type<int64>/g, '`${bigint}` //')
    // double -> number
    .replace(/0.0, \/\/ type<double>/g, 'number //')
    // float -> number
    .replace(/0.0, \/\/ type<float>/g, 'number //')
    // string -> string
    .replace(/"", \/\/ type<string>/g, 'string //')
    // i32[] -> number[]
    .replace(/\[0], \/\/ list<int32>/g, 'number[] //')
    // i64[] -> `${bigint}`[]

    .replace(/\["0"], \/\/ list<int64>/g, '`${bigint}`[] //')
    // string[] -> string[]
    .replace(/\[""], \/\/ list<string>/g, 'string[] //')
    // UNKNOWN -> unknown
    .replace(/UNKNOWN, \/\/ type<>/g, 'unknown //')

    // {"": ""} -> Record<string, string>
    .replace(/: {(.*?)\n(\s*)"": ""\n\s*}/g, ': $1\n$2Record<string, string>')
    // {"": {}} -> Record<string, {}>
    .replace(/: {(.*?)\n(\s*)"": {/g, ': $1\n$2Record<string, {')
    // {"0": false} -> Record<string, boolean>
    .replace(
      /: {(.*?)\n(\s*)"0": false\n\s*}/g,
      ': $1\n$2Record<string, boolean>',
    )
    // {"0": 0} -> Record<string, number>
    .replace(/: {(.*?)\n(\s*)"0": 0\n\s*}/g, ': $1\n$2Record<string, number>')
    // {"0": {}} -> Record<string, {}>
    .replace(/: {(.*?)\n(\s*)"0": {/g, ': $1\n$2Record<string, {')
    .replace(/}\n\s*},/g, '}>')

    // remove useless comma
    .replace(/},\n/g, '}\n')
    .replace(/>,\n/g, '>\n')
    // remove useless comment
    .replace(/\/\/ list<.*/g, '')
    .replace(/\/\/ map<.*/g, '')
    .replace(/}, \/\/ type<.*/g, '},')
    // remove empty inline comment
    .replace(/\s*\/\/\s*$/gm, '')
    // '// xxx' -> /** xxx */
    .replace(/\/\/\s*(.*?)\n/g, '/** $1 */\n')
    // */\n/** -> *
    .replace(/\*\/\n(\s*)\/\*\*/g, '\n$1 *')
    // replace 4 spaces with 2 spaces
    .replace(/ {4}/g, '  ')

    // optional parameters
    .replace(/\/\*\*[\s\S]+?\*\/\n.+?:/g, (text) => {
      if (OPTIONAL_PATTERN.test(text)) text = text.replace(/:$/, '?:')

      return text
    })

/** Generate API code */
const genCode = ({
  data,
  post,
  types,
}: {
  data: ApiInfo
  post: string
  types: string
}) => {
  const entries = Object.entries(data)
  return [
    post,
    '',
    types,
    '',
    `type FormatRes<T> = (T extends Record<'data', unknown> ? T['data'] : Record<string, never>) | undefined`,
    '',
    entries
      .map(([name, list]) => {
        const prefix = name.replace(/\./g, '_')
        return list
          .map((it) =>
            [
              '/**',
              ` * /${name}/${it.name}`,
              ` * @description ${it.desc}`,
              ` * @see ${it.ref}`,
              ' */',
              `export const ${prefix}_${it.name}: Request${it.name} extends Record<string, never> ? () => Promise<FormatRes<Response${it.name}>> : (data: Request${it.name}) => Promise<FormatRes<Response${it.name}>> = (data?: Request${it.name}) => post('/${name}/${it.name}', data)`,
            ].join('\n'),
          )
          .join('\n')
      })
      .join('\n'),
  ].join('\n')
}

/** Generate type declaration */
const genType = ({ name, desc, req, res, url }: DocInfo) => {
  const n = cap(toCamel(name.split('/').pop() ?? ''))

  const head = `
/**
 * ${n}
 * @description ${desc}
 * @see ${url}
 */`

  return `
${head}
type Request${n} = ${formatType(req)}
${head}
type Response${n} = ${formatType(res)}`
}

/** Load config file */
const loadConfig = async () => {
  const data = await read<{
    post: string | string[]
    output: string
    list: string[]
  }>(CONFIG_PATH)
  if (!data) {
    throw new Error(
      `Failed to load config from ${CONFIG_PATH}. File may be missing or empty.`,
    )
  }

  return {
    post: Array.isArray(data.post) ? data.post.join('\n') : data.post,
    output: data.output,
    list: Array.from(
      data.list
        .reduce(
          (map, item) => {
            const [name = '', branch] = item.split('@')
            map.set(name, { name, branch: branch || DEFAULT_BRANCH })
            return map
          },
          new Map<
            string,
            {
              name: string
              branch: string
            }
          >(),
        )
        .values(),
    ),
  }
}

/** Parse API info from content */
const parseApi = (name: string, content: string) => {
  const result: ApiInfo = {}

  const names = content
    .match(/type Response\S+/g)
    ?.map((i) => i.replace('type Response', ''))
  if (!names) throw new Error(`parseApi error: ${name}`)

  const descs = content
    .match(/\* @description [^\n]*\n/g)
    ?.map((i) => i.replace('* @description ', '').replace('\n', '').trim())
  if (!descs) throw new Error(`parseApi error: ${name}`)

  const refs = content
    .match(/\* @see [^\n]*\n/g)
    ?.map((i) => i.replace('* @see ', '').replace('\n', '').trim())
  if (!refs) throw new Error(`parseApi error: ${name}`)

  result[name] = names.map((it, i) => ({
    desc: descs[i * 2] ?? '',
    name: it,
    ref: refs[i * 2] ?? '',
  }))

  return result
}

/** Convert to camelCase */
const toCamel = (input: string) =>
  input
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '')

/** Generate API file task */
const generateApiFileTask = async (
  api: { name: string; desc: string; ref: string },
  serviceName: string,
  types: string,
  post: string,
  output: string,
  name: string,
) => {
  const fileName = api.name
  const fileContent = genCode({
    data: { [serviceName]: [api] },
    post,
    types: types
      .split('\n\n')
      .filter(
        (block) =>
          block.includes(`type Request${api.name} =`) ||
          block.includes(`type Response${api.name} =`),
      )
      .join('\n\n'),
  })
  await write(`${output}/${name}/${fileName}.ts`, fileContent)
}

/** Process service task */
const processServiceTask = async (
  name: string,
  branch: string,
  post: string,
  output: string,
) => {
  const types = await fetchDoc(name, branch)
  const apiInfo = parseApi(name, types)

  const subTasks = Object.entries(apiInfo).flatMap(([serviceName, apis]) =>
    apis.map(
      (api) => () =>
        generateApiFileTask(api, serviceName, types, post, output, name),
    ),
  )

  await runConcurrent(5, subTasks, {
    stopOnError: true,
  })
}

/** Main function */
const main = async () => {
  const { post, output, list } = await loadConfig()

  await remove(output)

  const tasks = list.map(
    ({ name, branch }) =>
      () =>
        processServiceTask(name, branch, post, output),
  )

  await runConcurrent(5, tasks, {
    stopOnError: true,
  })

  await exec(`npx eslint --fix ${output}/**/*.ts`)
}

export default main
