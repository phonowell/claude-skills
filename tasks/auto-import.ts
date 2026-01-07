import { runConcurrent } from 'fire-keeper'
import { Node, Project, SyntaxKind } from 'ts-morph'

import format from './format.js'
import getTsFiles from './utils/getTsFiles.js'

import type { SourceFile } from 'ts-morph'

type ImportItem = {
  name: string
  alias?: string
}

type ImportConfig = Record<string, string>

/** 获取文件中现有的导入声明 */
const getExistingImports = (file: SourceFile): Map<string, Set<string>> => {
  const importMap = new Map<string, Set<string>>()

  for (const importDecl of file.getImportDeclarations()) {
    const modulePath = importDecl.getModuleSpecifierValue()

    if (!importMap.has(modulePath)) importMap.set(modulePath, new Set())

    const imports = importMap.get(modulePath) as Set<string>

    // 添加默认导入
    const defaultImport = importDecl.getDefaultImport()?.getText()
    if (defaultImport) imports.add(defaultImport)

    // 添加命名导入
    for (const namedImport of importDecl.getNamedImports())
      imports.add(namedImport.getName())
  }

  return importMap
}

/** 检查标识符是否仅用于类型 */
const isTypeOnly = (file: SourceFile, name: string): boolean => {
  const identifiers = file
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .filter((id) => id.getText() === name)

  if (identifiers.length === 0) return true

  for (const id of identifiers) {
    const parent = id.getParent()

    // 跳过导入声明中的标识符
    if (Node.isImportSpecifier(parent) || Node.isImportDeclaration(parent))
      continue

    // 检查是否在类型位置
    const inTypePos =
      Node.isTypeReference(parent) ||
      Node.isTypeQuery(parent) ||
      Node.isTypeAliasDeclaration(parent) ||
      Node.isInterfaceDeclaration(parent) ||
      Node.isPropertySignature(parent) ||
      Node.isMethodSignature(parent) ||
      Node.isParameterDeclaration(parent) ||
      Node.isPropertyDeclaration(parent) ||
      Node.isAsExpression(parent) ||
      Node.isSatisfiesExpression(parent)

    if (!inTypePos) return false
  }

  return true
}

/** 修复类型导入和值导入混合的问题 */
const fixTypeValueImports = (file: SourceFile): boolean => {
  const imports = file.getImportDeclarations()
  let changed = false

  for (const importDecl of imports) {
    // 只处理类型导入
    if (!importDecl.isTypeOnly() || !importDecl.getNamedImports().length)
      continue

    const modSpec = importDecl.getModuleSpecifierValue()
    const typeImports: ImportItem[] = []
    const valueImports: ImportItem[] = []

    // 分类每个导入
    for (const namedImport of importDecl.getNamedImports()) {
      const name = namedImport.getName()
      const alias = namedImport.getAliasNode()?.getText()
      const importItem = { name, alias: alias ?? undefined }

      const actualName = alias ?? name

      if (isTypeOnly(file, actualName)) typeImports.push(importItem)
      else valueImports.push(importItem)
    }

    // 如果存在值导入，需要分离
    if (valueImports.length === 0) continue

    // 添加值导入
    file.addImportDeclaration({
      moduleSpecifier: modSpec,
      namedImports: valueImports.map((item) =>
        item.alias ? { name: item.name, alias: item.alias } : item.name,
      ),
    })

    // 处理剩余的类型导入
    importDecl.remove()

    if (typeImports.length > 0) {
      file.addImportDeclaration({
        moduleSpecifier: modSpec,
        namedImports: typeImports.map((item) =>
          item.alias ? { name: item.name, alias: item.alias } : item.name,
        ),
        isTypeOnly: true,
      })
    }

    changed = true
  }

  return changed
}

/** 查找缺失的导入 */
const findMissingImports = (
  file: SourceFile,
  existingImports: Map<string, Set<string>>,
  config: ImportConfig,
): Map<string, Set<string>> => {
  const missingImports = new Map<string, Set<string>>()
  const identifiers = file.getDescendantsOfKind(SyntaxKind.Identifier)

  for (const id of identifiers) {
    const name = id.getText()

    // 检查是否在配置中
    if (!config[name]) continue

    // 检查是否已导入
    const alreadyImported = Array.from(existingImports.values()).some(
      (imports) => imports.has(name),
    )

    if (alreadyImported) continue

    const pkgName = config[name]

    if (!missingImports.has(pkgName)) missingImports.set(pkgName, new Set())

    missingImports.get(pkgName)?.add(name)
  }

  return missingImports
}

/** 添加缺失的导入 */
const addMissingImports = (
  file: SourceFile,
  missingImports: Map<string, Set<string>>,
): boolean => {
  if (missingImports.size === 0) return false

  let changed = false

  for (const [pkg, imports] of missingImports.entries()) {
    for (const name of imports) {
      // 处理默认导入
      if (name === pkg) {
        file.addImportDeclaration({
          moduleSpecifier: pkg,
          defaultImport: name,
        })
        changed = true
        continue
      }

      // 处理命名导入
      const existingImport = file.getImportDeclaration(
        (decl) => decl.getModuleSpecifierValue() === pkg,
      )

      if (existingImport) existingImport.addNamedImport(name)
      else {
        file.addImportDeclaration({
          moduleSpecifier: pkg,
          namedImports: [name],
        })
      }

      changed = true
    }
  }

  return changed
}

/** 分析并修复文件导入 */
const analyzeFile = async (
  path: string,
  config: ImportConfig,
): Promise<string> => {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  project.addSourceFileAtPath(path)
  const file = project.getSourceFileOrThrow(path)

  const existingImports = getExistingImports(file)
  const missingImports = findMissingImports(file, existingImports, config)

  const addedImports = addMissingImports(file, missingImports)
  const fixedTypes = fixTypeValueImports(file)

  if (!addedImports && !fixedTypes) return ''

  await file.save()
  return path
}

/** 从auto-imports.d.ts加载配置 */
const loadConfig = (): ImportConfig => {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  })

  const dtsPath = './src/types/auto-imports.d.ts'
  project.addSourceFileAtPath(dtsPath)
  const file = project.getSourceFileOrThrow(dtsPath)

  // 获取全局声明块
  const globalDecl = file.getFirstDescendantByKind(SyntaxKind.ModuleDeclaration)

  if (!globalDecl)
    throw new Error('Global declaration not found in auto-imports.d.ts')

  const config: ImportConfig = {}

  // 解析变量声明
  const varDecls = globalDecl.getDescendantsOfKind(SyntaxKind.VariableStatement)

  for (const varStmt of varDecls) {
    const declarations = varStmt.getDeclarations()
    if (declarations.length === 0) continue

    const decl = declarations[0]
    const name = decl.getName()
    if (!name) continue

    const typeNode = decl.getTypeNode()
    if (!typeNode) continue

    const typeText = typeNode.getText()
    const importPath = /import\(['"](.*?)['"]\)/.exec(typeText)?.[1]
    const importName = /import\(['"](.*?)['"]\)\.(\w+)/.exec(typeText)?.[2]

    if (!importPath || !importName) continue

    config[name] = importPath
  }

  return config
}

/** 主函数 */
const main = async (listSource?: string | string[]): Promise<void> => {
  const sources = await getTsFiles(listSource)
  if (!sources.length) return

  const config = loadConfig()

  const tasks = sources.map((src) => () => analyzeFile(src, config))

  await format(await runConcurrent(5, tasks))
}

export default main
