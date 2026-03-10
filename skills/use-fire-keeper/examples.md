# 典型模板

## 触发与返回格式

### 已触发

输入：
`请用 fire-keeper 批量处理 ./src/**/*.ts`

输出骨架：
`✓ use-fire-keeper`
- 触发证据：用户显式要求使用 fire-keeper
- 选型：`glob + runConcurrent + echo`
- 方案：给最小可执行代码

### 未触发

输入：
`帮我改个 Node 脚本`

输出骨架：
`✗ 未触发/不适用`
- 原因：无显式要求且无既有依赖

## 批量文件处理

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
import copy from 'fire-keeper/copy'

await copy('./src/a.ts')
await copy('./src/a.ts', './dist')
await copy('./src', './dist')
await copy('./src/*.ts', './dist', {
  filename: (name) => name.replace('.ts', '.js'),
})
```

### 读取与写入

```typescript
import read from 'fire-keeper/read'
import write from 'fire-keeper/write'

const config = await read<{ port: number }>('./config.json')
const raw = await read('./bin/data.bin', { raw: true })
await write('./temp/config.json', config)
await write('./temp/data.bin', new Uint8Array([1, 2, 3]))
```

### 备份与恢复

```typescript
import backup from 'fire-keeper/backup'
import recover from 'fire-keeper/recover'

await backup('./data.txt')
await recover('./data.txt')
```

### 下载与压缩

```typescript
import download from 'fire-keeper/download'
import zip from 'fire-keeper/zip'

await download('https://example.com/file.txt', './temp')
await zip('./temp/file.txt', './dist', 'archive.zip')
```

### 监听变更

```typescript
import echo from 'fire-keeper/echo'
import glob from 'fire-keeper/glob'
import watch from 'fire-keeper/watch'

const files = await glob('./temp/*.txt')
if (!files.length) {
  echo('watch', 'no files found matching ./temp/*.txt')
} else {
  const unwatch = watch(files, (path) => {
    echo('watch', path)
  })

  unwatch()
}
```

### 静默读取

```typescript
import echo from 'fire-keeper/echo'
import read from 'fire-keeper/read'

const raw = await echo.freeze(read('./secret.bin', { raw: true }))
```
