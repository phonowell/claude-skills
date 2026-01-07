import { exec, read } from 'fire-keeper'

import autoImport from './auto-import.js'
import checkUnusedDeps from './check-unused-deps.js'
import fixExtensions from './fix-extensions.js'

type Pkg = {
  ActivityID: number
}

const main = async () => {
  const pkg = await read<Pkg>('package.json')
  if (!pkg) {
    console.error('❌ 读取 package.json 失败')
    process.exit(1)
  }

  try {
    // 1. 代码检查
    await autoImport()
    await fixExtensions()
    await checkUnusedDeps()

    // 2. 安装依赖
    await exec(['pnpm i'])

    // 3. 类型检查
    await exec(['tsc'])

    // 4. 构建
    await exec(['vite build'])

    // 5. 推送（仅在构建成功后执行）
    await exec([`activity push-cb ${pkg.ActivityID} dist`])

    console.log('✅ 推送成功')
  } catch (error) {
    console.error('❌ 推送失败:', error)
    process.exit(1)
  }
}

export default main
