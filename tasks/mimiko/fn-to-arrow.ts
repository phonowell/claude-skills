import { glob, runConcurrent } from 'fire-keeper'
import { type FunctionDeclaration, Project, SyntaxKind } from 'ts-morph'

import format from '../format.js'

const isObjectMethod = (fn: FunctionDeclaration): boolean => {
  const parent = fn.getParent()
  return parent.getKind() === SyntaxKind.ObjectLiteralExpression
}

const convertFunctionToArrow = (fn: FunctionDeclaration): void => {
  if (isObjectMethod(fn)) return

  const name = fn.getName()
  if (!name) return

  const isExported = fn.hasExportKeyword()
  const isDefaultExport = fn.hasDefaultKeyword()
  const isAsync = fn.isAsync()
  const typeParameters = fn
    .getTypeParameters()
    .map((tp) => tp.getText())
    .join(', ')
  const parameters = fn.getParameters()
  const returnType = fn.getReturnTypeNode()?.getText() ?? ''
  const body = fn.getBody()?.getText() ?? '{}'

  const typeParamsText = typeParameters ? `<${typeParameters}>` : ''
  const returnTypeText = returnType ? `: ${returnType}` : ''
  const asyncKeyword = isAsync ? 'async ' : ''

  // 保留多行参数格式
  const paramsText =
    parameters.length > 1
      ? `(\n  ${parameters.map((p) => p.getText()).join(',\n  ')},\n)`
      : `(${parameters.map((p) => p.getText()).join(', ')})`

  let replacement = ''
  if (isDefaultExport)
    replacement = `const ${name} = ${asyncKeyword}${typeParamsText}${paramsText}${returnTypeText} => ${body}\nexport default ${name}`
  else if (isExported)
    replacement = `export const ${name} = ${asyncKeyword}${typeParamsText}${paramsText}${returnTypeText} => ${body}`
  else
    replacement = `const ${name} = ${asyncKeyword}${typeParamsText}${paramsText}${returnTypeText} => ${body}`

  fn.replaceWithText(replacement)
}

const processFile = async (filePath: string): Promise<string | null> => {
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(filePath)

  const functions = sourceFile.getDescendantsOfKind(
    SyntaxKind.FunctionDeclaration,
  )
  if (!functions.length) return null

  let hasChanges = false
  for (const fn of functions) {
    if (!isObjectMethod(fn)) {
      convertFunctionToArrow(fn)
      hasChanges = true
    }
  }

  if (!hasChanges) return null

  await sourceFile.save()
  return filePath
}

const listSources = () =>
  glob(['./src/**/*.ts', './src/**/*.tsx', './tasks/**/*.ts', '!**/*.d.ts'])

const main = async () => {
  const list = await listSources()
  if (!list.length) return

  const changedFiles = (
    await runConcurrent(
      5,
      list.map((it) => () => processFile(it)),
    )
  ).filter(Boolean) as string[]

  if (changedFiles.length) {
    console.log(`✓ ${changedFiles.length} 个文件已转换`)
    changedFiles.forEach((file) => console.log(`  ${file}`))

    await format(changedFiles)
    console.log('✓ ESLint 格式化完成')
  } else console.log('无需转换的文件')
}

export default main
