# 典型模板

## 批量文件处理

```typescript
import { glob, runConcurrent, echo, wrapList } from 'fire-keeper'

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

## 复制与改名

```typescript
import copy from 'fire-keeper/copy.js'

await copy('./src/a.ts')
await copy('./src/a.ts', './dist')
await copy('./src/a.ts', './dist', 'index.ts')
await copy('./src/*.ts', './dist', {
  filename: (name) => name.replace('.ts', '.js'),
})
```

## 读取配置与二进制

```typescript
import read from 'fire-keeper/read.js'

const config = await read<{ port: number }>('./config.json')
const data = await read('./data.yaml')
const text = await read('./logs/app.txt')
const raw = await read('./bin/data.bin', { raw: true })
```

## 交互式提示（带缓存 id）

```typescript
import prompt from 'fire-keeper/prompt.js'

const name = await prompt({ type: 'text', message: 'Name?', id: 'user.name' })
const env = await prompt({
  type: 'select',
  message: 'Env?',
  list: ['dev', 'prod'],
  id: 'user.env',
})
const ok = await prompt({
  type: 'confirm',
  message: 'Continue?',
  id: 'user.ok',
})
```

## 备份与恢复

```typescript
import backup from 'fire-keeper/backup.js'
import recover from 'fire-keeper/recover.js'

await backup('./data.txt')
await recover('./data.txt')
```

## 下载与压缩

```typescript
import download from 'fire-keeper/download.js'
import zip from 'fire-keeper/zip.js'

await download('https://example.com/file.txt', './temp')
await zip('./temp/file.txt', './dist', 'archive.zip')
```

## 监听变更

```typescript
import watch from 'fire-keeper/watch.js'
import echo from 'fire-keeper/echo.js'

const unwatch = watch(
  './temp/file.txt',
  (path) => {
    echo('watch', path)
  },
  { debounce: 300 },
)

unwatch()
```
