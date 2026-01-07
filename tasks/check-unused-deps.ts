import { glob, read } from 'fire-keeper'
import { Project } from 'ts-morph'

import getTsFiles from './utils/getTsFiles.js'

import type { SourceFile } from 'ts-morph'

type PackageJson = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

type DependenciesMap = {
  used: Set<string>
  unused: Set<string>
}

/** 要检查的配置文件列表 */
const CONFIG_FILES = ['vite.config.ts', 'eslint.config.mjs']

/** 要检查的源代码文件模式 */
const SOURCE_FILES_PATTERN = './{src,tasks}/**/*.{ts,tsx}'

/** 白名单包列表，这些包被视为已使用 */
const WHITELIST_PACKAGES = [
  '@bilibili-firebird/lib.activity-fetcher',
  '@bilibili-firebird/lib.bridge',
  '@bilibili/activity',
  'axios',
  'clsx',
  'nib',
  'node',
  'page-lifecycle',
  'react',
  'react-dom',
  'stylus',
  'swr',
  'terser',
  'tsx',
  'typescript',
  'vite',
  'web-vitals',
]

/** 判断是否是包导入（而非相对导入） */
const isPackageImport = (moduleSpecifier: string): boolean =>
  !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')

/** 从模块说明符中提取主包名 */
const extractMainPackage = (moduleSpecifier: string): string | undefined => {
  const mainPackage = RegExp(/^(@[^/]+\/[^/]+|[^@/][^/]*)/).exec(
    moduleSpecifier,
  )
  return mainPackage?.[0]
}

/** 处理一个模块导入，如果是有效的包导入则添加到集合中 */
const addPackageIfValid = (
  packages: Set<string>,
  moduleSpecifier: string,
): void => {
  if (!isPackageImport(moduleSpecifier)) return

  const packageName = extractMainPackage(moduleSpecifier)
  if (!packageName) return

  packages.add(packageName)
}

/** 从import语句中提取导入的包名 */
const processImportDeclarations = (
  file: SourceFile,
  packages: Set<string>,
): void => {
  const importDeclarations = file.getImportDeclarations()

  for (const importDecl of importDeclarations)
    addPackageIfValid(packages, importDecl.getModuleSpecifierValue())
}

/** 从文件中获取所有导入的包名 */
const getImportedPackages = (file: SourceFile): Set<string> => {
  const packages = new Set<string>()
  processImportDeclarations(file, packages)
  return packages
}

/** 从配置文件内容中提取潜在的包引用 */
const extractPackagesFromConfig = (content: string): Set<string> => {
  const packages = new Set<string>()

  // Match package imports in the format: import x from 'package'
  const importMatches = content.match(/from\s+['"]([^'"./][^'"]*)['"]/g)
  if (importMatches) {
    for (const match of importMatches) {
      const packageName = match.replace(/from\s+['"]([^'"]*)['"]/g, '$1')
      const mainPackage = extractMainPackage(packageName)
      if (mainPackage) packages.add(mainPackage)
    }
  }

  // Match package names in quotes (for plugins or direct references)
  const packageMatches = content.match(
    /"(@[^/]+\/[^/"]+")|"([^./][^/"][^"]*?")/g,
  )

  if (packageMatches)
    for (const match of packageMatches) packages.add(match.replace(/"/g, ''))

  return packages
}

/** 读取配置文件并提取引用的包 */
const processConfigFile = async (filePath: string): Promise<Set<string>> => {
  const packages = new Set<string>()

  try {
    const raw = await read(filePath)
    if (!raw) return packages

    const content = raw.toString()
    const configPackages = extractPackagesFromConfig(content)

    for (const pkg of configPackages) packages.add(pkg)
  } catch (error) {
    console.error(`Error reading config file ${filePath}:`, error)
  }

  return packages
}

/** 检查配置文件中的依赖项引用 */
const getConfigReferencedPackages = async (): Promise<Set<string>> => {
  const configFiles = await glob(CONFIG_FILES)

  const packages = new Set<string>()

  for (const file of configFiles) {
    const filePackages = await processConfigFile(file)
    for (const pkg of filePackages) packages.add(pkg)
  }

  return packages
}

/** 创建ts-morph项目并添加源文件 */
const createProjectWithFiles = (filePaths: string[]): Project => {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  for (const filePath of filePaths) project.addSourceFileAtPath(filePath)

  return project
}

/** 从项目的源文件中收集使用的包 */
const collectPackagesFromFiles = (project: Project): Set<string> => {
  const usedPackages = new Set<string>()

  for (const file of project.getSourceFiles()) {
    const packages = getImportedPackages(file)
    for (const pkg of packages) usedPackages.add(pkg)
  }

  return usedPackages
}

/** 判断是否是类型定义包 */
const isTypesPackage = (packageName: string): boolean =>
  packageName.startsWith('@types/')

/** 获取类型定义包对应的实际包名 */
const getOriginalPackageName = (typesPackage: string): string =>
  typesPackage.replace('@types/', '')

/**
 * 处理类型定义包
 * 如果对应的原始包被使用，则类型定义包也被视为已使用
 */
const processTypesPackages = (
  usedDeps: Set<string>,
  allDeps: Record<string, string>,
): void => {
  const typesPackages = Object.keys(allDeps).filter(isTypesPackage)

  for (const typesPkg of typesPackages) {
    // 如果类型包已经被标记为使用，跳过
    if (usedDeps.has(typesPkg)) continue

    const originalPkg = getOriginalPackageName(typesPkg)

    // 如果原始包被使用，则该类型包也视为已使用
    if (usedDeps.has(originalPkg)) usedDeps.add(typesPkg)

    // 对于React类型包的特殊处理
    if (
      typesPkg === '@types/react' &&
      (usedDeps.has('react') || WHITELIST_PACKAGES.includes('react'))
    )
      usedDeps.add(typesPkg)

    // 如果原始包在白名单中，类型包也被视为已使用
    if (WHITELIST_PACKAGES.includes(originalPkg)) usedDeps.add(typesPkg)
  }
}

/** 将白名单包添加到使用中的依赖集合 */
const addWhitelistedPackages = (
  usedDeps: Set<string>,
  allDeps: Record<string, string>,
): void => {
  for (const pkg of WHITELIST_PACKAGES) if (allDeps[pkg]) usedDeps.add(pkg)
}

/** 从项目文件中分析已使用的依赖项 */
const analyzeUsedDependencies = async (
  allDeps: Record<string, string>,
): Promise<Set<string>> => {
  const tsFiles = await getTsFiles(SOURCE_FILES_PATTERN)

  const project = createProjectWithFiles(tsFiles)
  const filePackages = collectPackagesFromFiles(project)

  const usedPackages = new Set<string>()
  for (const pkg of filePackages) usedPackages.add(pkg)

  const configPackages = await getConfigReferencedPackages()
  for (const pkg of configPackages) usedPackages.add(pkg)

  // Add whitelisted packages that exist in dependencies
  addWhitelistedPackages(usedPackages, allDeps)

  // Process @types packages
  processTypesPackages(usedPackages, allDeps)

  return usedPackages
}

/** 确定未使用的依赖项 */
const findUnusedDependencies = (
  allDeps: Record<string, string>,
  usedDeps: Set<string>,
): Set<string> => {
  const unusedDeps = new Set<string>()

  for (const dep of Object.keys(allDeps)) {
    if (usedDeps.has(dep)) continue

    unusedDeps.add(dep)
  }

  return unusedDeps
}

/** 从package.json分析依赖项 */
const analyzeDeps = async (): Promise<DependenciesMap> => {
  const packageJson = await read<PackageJson>('./package.json')

  if (!packageJson) throw new Error('Could not read package.json')

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  const usedDepsSet = await analyzeUsedDependencies(allDeps)

  const unusedDeps = findUnusedDependencies(allDeps, usedDepsSet)

  return {
    used: new Set(Object.keys(allDeps).filter((dep) => !unusedDeps.has(dep))),
    unused: unusedDeps,
  }
}

/** 主函数 */
const main = async (): Promise<void> => {
  const depsMap = await analyzeDeps()
  if (!depsMap.unused.size) return

  console.log(
    [
      '未使用的依赖项:',
      '',
      ...Array.from(depsMap.unused).map((dep) => `  - ${dep}`),
      '',
      '可以使用以下命令卸载未使用的依赖项:',
      '',
      `  pnpm rm ${Array.from(depsMap.unused).join(' ')}`.trim(),
      '',
      '请注意，卸载依赖项可能会影响项目的功能，请在卸载前仔细检查。',
    ].join('\n'),
  )
}

export default main
