import { isExist, read, stat } from 'fire-keeper'

/** 获取文件修改时间 */
export const getFileTime = async (path: string): Promise<number> => {
  if (!(await isExist(path))) return 0
  const fileStat = await stat(path)
  return fileStat?.mtimeMs ?? 0
}

/** 获取文件行数 */
export const getFileLines = async (path: string): Promise<number> => {
  if (!(await isExist(path))) return 0
  const content = await read(path, { raw: true })
  if (!content) return 0
  return content.toString().split('\n').length
}
