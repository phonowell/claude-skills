# 典型模板

## 触发与返回格式

### 已触发（显式要求）

输入：
`请用 fire-keeper 批量处理 ./src/**/*.ts`

输出骨架：
`✓ use-fire-keeper`
- 触发证据：用户显式要求使用 fire-keeper
- 选型：`glob + runConcurrent + echo`
- 方案：给最小可执行代码

### 未触发（应拒绝引入）

输入：
`帮我改个 Node 脚本`（现有代码也未使用 fire-keeper）

输出骨架：
`✗ 未触发/不适用`
- 原因：无显式要求且无既有依赖

## 批量文件处理（标准模板）

```typescript
import { echo, glob, runConcurrent, wrapList } from 'fire-keeper'

const fn = async (source: string | string[], { concurrency = 5 } = {}) => {
  const listSource = await glob(source)
  if (!listSource.length) {
    echo('fn', `no files found matching ${wrapList(source)}`)
    return
  }

  await runConcurrent(
    concurrency,
    listSource.map((src) => async () => {
      echo('fn', `processing ${src}`)
    }),
  )

  echo('fn', `processed ${wrapList(source)}`)
}
```

## 常见任务最小方案

### 复制与改名

```typescript
import copy from 'fire-keeper/copy.js'

await copy('./src/a.ts')
await copy('./src/a.ts', './dist')
await copy('./src/*.ts', './dist', {
  filename: (name) => name.replace('.ts', '.js'),
})
```

### 读取配置与二进制

```typescript
import read from 'fire-keeper/read.js'

const config = await read<{ port: number }>('./config.json')
const data = await read('./data.yaml')
const raw = await read('./bin/data.bin', { raw: true })
```

### 写入对象与 TypedArray

```typescript
import write from 'fire-keeper/write.js'

await write('./temp/config.json', { env: 'prod' })
await write('./temp/data.bin', new Uint8Array([1, 2, 3]))
```

### 备份与恢复

```typescript
import backup from 'fire-keeper/backup.js'
import recover from 'fire-keeper/recover.js'

await backup('./data.txt')
await recover('./data.txt')
```

### 下载与压缩

```typescript
import download from 'fire-keeper/download.js'
import zip from 'fire-keeper/zip.js'

await download('https://example.com/file.txt', './temp')
await zip('./temp/file.txt', './dist', 'archive.zip')
```

### 监听变更（change only）

```typescript
import echo from 'fire-keeper/echo.js'
import watch from 'fire-keeper/watch.js'

const unwatch = watch(
  './temp/file.txt',
  (path) => {
    echo('watch', path)
  },
  { debounce: 300 },
)

unwatch()
```

### 静默执行片段

```typescript
import echo from 'fire-keeper/echo.js'
import read from 'fire-keeper/read.js'

const raw = await echo.freeze(read('./secret.bin', { raw: true }))
```
