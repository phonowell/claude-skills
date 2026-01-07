import { join, relative } from 'node:path'

import { echo, glob, isSame, normalizePath, read } from 'fire-keeper'
import { trim } from 'radash'

import { executeDelete, overwriteFile, promptAction } from './operations.js'

// 类型定义
type SyncItemType = 'include' | 'exclude'

type SyncItem = {
  pattern: string
  type?: SyncItemType
}

type SyncConfig = {
  base: string
  list: Array<string | SyncItem>
}

// 常量
const TARGET_BASE_PATH = '../midway'
const SYNC_CONFIG_PATTERNS = ['./data/sync.yaml', './data/sync/**/*.yaml']

/** 计算文件层级深度 */
const getFileDepth = (filePath: string): number => {
  // data/sync.yaml -> 0
  // data/sync/mimiko.yaml -> 1
  // data/sync/foo/bar.yaml -> 2
  const match = filePath.match(/data\/sync\/(.*)/)
  if (!match?.[1]) return 0
  return match[1].split('/').length - 1
}

/** 标准化 SyncItem */
const normalizeSyncItem = (item: string | SyncItem): SyncItem => {
  if (typeof item === 'string') return { pattern: item, type: 'include' }

  return { ...item, type: item.type ?? 'include' }
}

/** 加载同步配置 */
const loadConfig = async (): Promise<SyncConfig[]> => {
  const files = await glob(SYNC_CONFIG_PATTERNS)

  // 读取所有文件及其配置
  type FileConfig = {
    depth: number
    configs: SyncConfig[]
  }

  const fileConfigs: FileConfig[] = []
  for (const file of files) {
    const content = await read<SyncConfig[]>(file)
    if (content) {
      fileConfigs.push({
        depth: getFileDepth(file),
        configs: content,
      })
    }
  }

  // 按深度排序（浅层优先，后续会被深层覆盖）
  fileConfigs.sort((a, b) => a.depth - b.depth)

  // 合并配置：使用 Map 存储，key 为 `${base}:${pattern}`
  const mergedMap = new Map<string, SyncItem & { base: string }>()

  for (const { configs } of fileConfigs) {
    for (const config of configs) {
      const normalizedBase = trim(config.base || '.', ' /')
      for (const item of config.list) {
        const normalized = normalizeSyncItem(item)
        const key = `${normalizedBase}:${normalized.pattern}`
        mergedMap.set(key, { ...normalized, base: normalizedBase })
      }
    }
  }

  // 转换回 SyncConfig[] 格式，按 base 分组
  const resultMap = new Map<string, SyncItem[]>()
  for (const item of Array.from(mergedMap.values())) {
    const { base, pattern, type } = item
    if (!resultMap.has(base)) resultMap.set(base, [])

    const list = resultMap.get(base)
    if (list) list.push({ pattern, type })
  }

  return Array.from(resultMap.entries()).map(([base, list]) => ({
    base,
    list,
  }))
}

/** 同步配置文件本身 */
const syncConfigFiles = async () => {
  const cwd = process.cwd()
  const sourceBase = normalizePath(cwd)
  const targetBase = normalizePath(join(cwd, TARGET_BASE_PATH))

  const configFiles = await glob(SYNC_CONFIG_PATTERNS)

  // 顺序处理，避免多个 prompt 并发执行
  for (const configFile of configFiles) {
    const relPath = relative(sourceBase, configFile)
    const targetFile = join(targetBase, relPath)
    await syncFile(configFile, targetFile)
  }
}

/** 同步单个文件 */
const syncFile = async (sourcePath: string, targetPath: string) => {
  if (await isSame([sourcePath, targetPath])) return

  echo(`**${sourcePath}** is different from **${targetPath}**`)

  const action = await promptAction(sourcePath, targetPath)
  if (action === 'skip') return

  await overwriteFile(action, sourcePath, targetPath)
}

/** 处理单个配置项 */
const processItem = async (base: string, item: SyncItem) => {
  const { pattern, type } = item
  const trimmedPattern = trim(pattern, ' ')

  // 删除操作：只有 include 类型才执行删除
  if (trimmedPattern.startsWith('/')) {
    if (type === 'include')
      await executeDelete(base, trimmedPattern, TARGET_BASE_PATH)

    return
  }

  // exclude 类型不执行同步操作
  if (type === 'exclude') return

  const cwd = process.cwd()
  const sourceBase = normalizePath(join(cwd, base))
  const targetBase = normalizePath(join(cwd, TARGET_BASE_PATH, base))

  // 查找源文件和目标文件
  const sourcePattern = join(sourceBase, trimmedPattern)
  const targetPattern = join(targetBase, trimmedPattern)

  const [sourceFiles, targetFiles] = await Promise.all([
    glob(sourcePattern, { deep: trimmedPattern.includes('/') ? undefined : 1 }),
    glob(targetPattern, { deep: trimmedPattern.includes('/') ? undefined : 1 }),
  ])

  // 收集所有需要同步的文件路径
  const filesToSync = new Map<string, { source: string; target: string }>()

  // 添加源文件
  for (const sourceFile of sourceFiles) {
    const relPath = relative(sourceBase, sourceFile)
    const targetFile = join(targetBase, relPath)
    filesToSync.set(relPath, { source: sourceFile, target: targetFile })
  }

  // 添加仅存在于目标的文件
  for (const targetFile of targetFiles) {
    const relPath = relative(targetBase, targetFile)
    if (!filesToSync.has(relPath)) {
      const sourceFile = join(sourceBase, relPath)
      filesToSync.set(relPath, { source: sourceFile, target: targetFile })
    }
  }

  // 顺序处理，避免多个 prompt 并发执行
  for (const { source, target } of Array.from(filesToSync.values()))
    await syncFile(source, target)
}

/** 处理配置项 */
const processConfig = async (config: SyncConfig) => {
  const { base, list } = config
  const normalizedBase = trim(base || '.', ' /')
  for (const item of list) {
    const normalized = normalizeSyncItem(item)
    await processItem(normalizedBase, normalized)
  }
}

/** 主函数 */
const main = async () => {
  // 第一阶段：优先同步配置文件本身
  await syncConfigFiles()

  // 重新加载配置（配置可能已更新）
  const configs = await loadConfig()

  // 第二阶段：顺序处理所有配置项（避免 prompt 并发）
  for (const config of configs) await processConfig(config)
}

export default main
