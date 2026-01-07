import { echo } from 'fire-keeper'
import { Node, Project } from 'ts-morph'

import getTsFiles from './utils/getTsFiles.js'

import type { CallExpression } from 'ts-morph'

type RedundantInfo = {
  file: string
  line: number
  hookName: string
  redundant: string[]
}

/** React Hooks 名称列表 */
const REACT_HOOKS = ['useEffect', 'useMemo', 'useCallback']

/** 创建 ts-morph 项目并添加源文件 */
const createProject = async (): Promise<Project> => {
  const filePaths = await getTsFiles()
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  for (const filePath of filePaths) project.addSourceFileAtPath(filePath)

  return project
}

/** 判断是否是 React Hook 调用 */
const isReactHookCall = (node: CallExpression): boolean => {
  const expression = node.getExpression()
  if (!Node.isIdentifier(expression)) return false

  const hookName = expression.getText()
  return REACT_HOOKS.includes(hookName)
}

/** 从依赖数组中提取标识符名称 */
const extractDepsFromArray = (depsArg: Node | undefined): Set<string> => {
  const deps = new Set<string>()

  if (!depsArg || !Node.isArrayLiteralExpression(depsArg)) return deps

  const elements = depsArg.getElements()
  for (const element of elements) {
    // 处理简单标识符: [foo, bar]
    if (Node.isIdentifier(element)) {
      deps.add(element.getText())
      continue
    }

    // 处理属性访问: [obj.prop, arr[0]]
    if (Node.isPropertyAccessExpression(element)) {
      const rootIdentifier = element.getExpression()
      if (Node.isIdentifier(rootIdentifier)) deps.add(rootIdentifier.getText())

      continue
    }

    if (Node.isElementAccessExpression(element)) {
      const rootIdentifier = element.getExpression()
      if (Node.isIdentifier(rootIdentifier)) deps.add(rootIdentifier.getText())
    }
  }

  return deps
}

/** 获取回调函数参数名称（需要排除） */
const getCallbackParams = (callbackArg: Node | undefined): Set<string> => {
  const params = new Set<string>()

  if (!callbackArg) return params

  // 箭头函数: () => {}
  if (Node.isArrowFunction(callbackArg)) {
    const parameters = callbackArg.getParameters()
    for (const param of parameters) {
      const name = param.getName()
      if (name) params.add(name)
    }
    return params
  }

  // 函数表达式: function() {}
  if (Node.isFunctionExpression(callbackArg)) {
    const parameters = callbackArg.getParameters()
    for (const param of parameters) {
      const name = param.getName()
      if (name) params.add(name)
    }
  }

  return params
}

/** 获取回调函数内部声明的变量（需要排除） */
const getInternalDeclarations = (
  callbackArg: Node | undefined,
): Set<string> => {
  const declared = new Set<string>()

  if (!callbackArg) return declared

  // 获取回调函数体
  let body: Node | undefined
  if (Node.isArrowFunction(callbackArg)) {
    const arrowBody = callbackArg.getBody()
    body = Node.isBlock(arrowBody) ? arrowBody : undefined
  } else if (Node.isFunctionExpression(callbackArg))
    body = callbackArg.getBody()

  if (!body) return declared

  // 遍历函数体内的变量声明
  body.forEachDescendant((node) => {
    if (Node.isVariableDeclaration(node)) {
      const nameNode = node.getNameNode()

      // 简单标识符: const foo = ...
      if (Node.isIdentifier(nameNode)) {
        declared.add(nameNode.getText())
        return
      }

      // 解构: const { foo, bar } = ...
      if (Node.isObjectBindingPattern(nameNode)) {
        const elements = nameNode.getElements()
        for (const element of elements) {
          const name = element.getName()
          if (name) declared.add(name)
        }
        return
      }

      // 数组解构: const [foo, bar] = ...
      if (Node.isArrayBindingPattern(nameNode)) {
        const elements = nameNode.getElements()
        for (const element of elements) {
          if (Node.isBindingElement(element)) {
            const name = element.getName()
            if (name) declared.add(name)
          }
        }
      }
    }

    // 函数声明: function foo() {}
    if (Node.isFunctionDeclaration(node)) {
      const name = node.getName()
      if (name) declared.add(name)
    }
  })

  return declared
}

/** 收集回调函数中实际引用的外部标识符 */
const collectReferencedIdentifiers = (
  callbackArg: Node | undefined,
  excludeParams: Set<string>,
  excludeDeclared: Set<string>,
): Set<string> => {
  const referenced = new Set<string>()

  if (!callbackArg) return referenced

  const excludeSet = new Set([...excludeParams, ...excludeDeclared])

  callbackArg.forEachDescendant((node) => {
    if (!Node.isIdentifier(node)) return

    const name = node.getText()

    // 排除回调参数和内部声明
    if (excludeSet.has(name)) return

    // 排除属性名（obj.prop 中的 prop）
    const parent = node.getParent()
    if (
      Node.isPropertyAccessExpression(parent) &&
      parent.getNameNode() === node
    )
      return

    // 排除属性简写（{ foo } 中的 foo，当它是属性名时）
    if (Node.isShorthandPropertyAssignment(parent)) {
      // 如果是值位置，保留；如果是键位置，排除
      // 简化处理：shorthand 总是引用外部变量
      referenced.add(name)
      return
    }

    // 添加到引用集合
    referenced.add(name)
  })

  return referenced
}

/** 检查单个 Hook 调用的冗余依赖 */
const checkHookCall = (callExpr: CallExpression): RedundantInfo | null => {
  const args = callExpr.getArguments()
  if (args.length < 2) return null

  const [callbackArg, depsArg] = args

  // 提取依赖数组
  const declaredDeps = extractDepsFromArray(depsArg)
  if (declaredDeps.size === 0) return null

  // 排除集合
  const excludeParams = getCallbackParams(callbackArg)
  const excludeDeclared = getInternalDeclarations(callbackArg)

  // 收集实际引用
  const actualRefs = collectReferencedIdentifiers(
    callbackArg,
    excludeParams,
    excludeDeclared,
  )

  // 计算冗余
  const redundant: string[] = []
  for (const dep of declaredDeps) if (!actualRefs.has(dep)) redundant.push(dep)

  if (redundant.length === 0) return null

  // 获取位置信息
  const expression = callExpr.getExpression()
  const hookName = Node.isIdentifier(expression)
    ? expression.getText()
    : 'unknown'

  const sourceFile = callExpr.getSourceFile()
  const line = callExpr.getStartLineNumber()

  return {
    file: sourceFile.getFilePath(),
    line,
    hookName,
    redundant,
  }
}

/** 检查项目中所有文件的冗余依赖 */
const checkAllFiles = (project: Project): RedundantInfo[] => {
  const results: RedundantInfo[] = []

  for (const sourceFile of project.getSourceFiles()) {
    sourceFile.forEachDescendant((node) => {
      if (!Node.isCallExpression(node)) return
      if (!isReactHookCall(node)) return

      const result = checkHookCall(node)
      if (result) results.push(result)
    })
  }

  return results
}

/** 输出检查结果 */
const reportResults = (results: RedundantInfo[]): void => {
  if (results.length === 0) {
    echo('✓ 未发现冗余依赖')
    return
  }

  echo(`\n发现 ${results.length} 处冗余依赖：\n`)

  for (const { file, line, hookName, redundant } of results) {
    const relativePath = file.replace(process.cwd(), '.')
    echo(`${relativePath}:${line} - ${hookName} - [${redundant.join(', ')}]`)
  }

  const totalRedundant = results.reduce((sum, r) => sum + r.redundant.length, 0)
  echo(`\n✗ 总计 ${totalRedundant} 个冗余依赖项`)
}

/** 主函数 */
const main = async () => {
  echo('→ 检查 React Hooks 依赖数组冗余...\n')

  const project = await createProject()
  const results = checkAllFiles(project)

  reportResults(results)
}

export default main
