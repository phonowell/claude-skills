import * as path from 'path'

import { argv, exec, isExist, mkdir, normalizePath, write } from 'fire-keeper'
import { dash, pascal } from 'radash'

const COMPONENT_TYPES = ['area', 'float', 'part']
const ROOT_PATH = './src/components'

const STYLUS_TEMPLATE = `
$base = '{{base}}'
$bgi = $proxy($base, 'bgi')
$size = $proxy($base, 'size')

.{{type}}-{{name}}
  $debug()
`

const TSX_TEMPLATES = {
  area: `
import './{{Name}}.styl'
import { Area } from '@bilibili-firebird/activity-utils'

const Area{{Name}} = () => {
  return <Area className='area-{{name}}'><></></Area>
}

export default Area{{Name}}
`,
  float: `
import './{{Name}}.styl'
import { Button, Modal } from '@bilibili-firebird/activity-utils'

type Props = {
  close: () => void
}

const Float{{Name}} = ({ close }: Props) => {
  return (
    <Modal className='float float-{{name}}' onClickOutside={close}>
      <Button className='btn-close' onClick={close} />
    </Modal>
  )
}

export default Float{{Name}}
`,
  part: `
import './{{Name}}.styl'

const Part{{Name}} = () => {
  return <div className='part-{{name}}'><></></div>
}

export default Part{{Name}}
`,
}

/**
 * 检查组件是否已存在
 * @param type 组件类型
 * @param pascalName 组件名（驼峰式）
 * @returns 是否存在
 */
const checkComponentExists = (type: string, pascalName: string) =>
  isExist(`${ROOT_PATH}/${type}/${pascalName}.tsx`)

/**
 * 创建静态资源目录
 * @param dashName 组件名（短横线式）
 */
const createStaticDirectory = async (dashName: string) => {
  await mkdir(`./src/static/${dashName.toLowerCase()}`)
}

/**
 * 创建样式文件
 * @param type 组件类型
 * @param pascalName 组件名（驼峰式）
 * @param dashName 组件名（短横线式）
 */
const createStyleFile = async (
  type: string,
  pascalName: string,
  dashName: string,
) => {
  const stylus = STYLUS_TEMPLATE.replace(
    /\{\{base\}\}/g,
    path
      .relative(
        `${ROOT_PATH}/${type}`,
        normalizePath(`./src/static/${dashName}`),
      )
      .replace(/\\/g, '/'),
  )
    .replace(/\{\{type\}\}/g, type)
    .replace(/\{\{name\}\}/g, dashName)
  await write(`${ROOT_PATH}/${type}/${pascalName}.styl`, stylus.trim())
}

/**
 * 创建 TSX 文件
 * @param type 组件类型
 * @param pascalName 组件名（驼峰式）
 * @param dashName 组件名（短横线式）
 */
const createTsxFile = async (
  type: string,
  pascalName: string,
  dashName: string,
) => {
  const tsx = TSX_TEMPLATES[type as keyof typeof TSX_TEMPLATES]
    .replace(/\{\{name\}\}/g, dashName)
    .replace(/\{\{Name\}\}/g, pascalName)
  await write(`${ROOT_PATH}/${type}/${pascalName}.tsx`, tsx.trim())
}

/**
 * 解析命令行参数
 * @returns 组件类型和名称的数组
 */
const parseCommandLineArgs = async (): Promise<[string, string][]> => {
  const entries: [string, string][] = (await argv())._.slice(1).map((e) => {
    const entry = e.toString()
    if (!entry.includes('/')) throw new Error(`Invalid path: ${entry}`)

    const [type, name] = entry.split('/').map((it) => it.toLowerCase().trim())
    if (!COMPONENT_TYPES.includes(type))
      throw new Error(`Invalid component type: ${type}`)

    return [type, name]
  })
  if (!entries.length) throw new Error('No component specified')
  return entries
}

/** 主函数：创建新组件 */
const main = async () => {
  const changedFiles: string[] = []

  for (const [type, name] of await parseCommandLineArgs()) {
    const pascalName = pascal(name)
    const dashName = dash(name)
    if (await checkComponentExists(type, pascalName))
      throw new Error(`Component ${pascalName} already exists`)
    await createStyleFile(type, pascalName, dashName)
    await createTsxFile(type, pascalName, dashName)
    await createStaticDirectory(dashName)
    changedFiles.push(`${ROOT_PATH}/${type}/${pascalName}.tsx`)
  }

  await exec(`npx eslint --fix ${changedFiles.join(' ')}`)
}

export default main
export { parseCommandLineArgs }
