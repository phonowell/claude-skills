import { remove } from 'fire-keeper'
import { dash, pascal } from 'radash'

import { parseCommandLineArgs } from './add.js'

const ROOT_PATH = './src/components'

/**
 * 删除组件的静态资源目录
 * @param dashName 组件名（短横线式）
 */
const deleteStaticDirectory = async (dashName: string) => {
  await remove(`./src/static/${dashName}`)
}

/**
 * 删除组件的样式文件
 * @param type 组件类型
 * @param pascalName 组件名（驼峰式）
 */
const deleteStyleFile = async (type: string, pascalName: string) => {
  await remove(`${ROOT_PATH}/${type}/${pascalName}.styl`)
}

/**
 * 删除组件的 TSX 文件
 * @param type 组件类型
 * @param pascalName 组件名（驼峰式）
 */
const deleteTsxFile = async (type: string, pascalName: string) => {
  await remove(`${ROOT_PATH}/${type}/${pascalName}.tsx`)
}

/** 主函数：删除指定的组件 */
const main = async () => {
  for (const [type, name] of await parseCommandLineArgs()) {
    const pascalName = pascal(name)
    const dashName = dash(name)
    await deleteStyleFile(type, pascalName)
    await deleteTsxFile(type, pascalName)
    await deleteStaticDirectory(dashName)
  }
}

export default main
