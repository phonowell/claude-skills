# API 参考（use-fire-keeper）

## 高频映射
- 文件批处理：`glob` -> 无匹配 `echo + return` -> `runConcurrent`
- 文件读写：`read/write`（统一解析与目录创建语义）
- 路径归一：`normalizePath`（不要手动拼 `root()/home()`）
- 日志与静默：`echo` + `freeze/whisper/pause/resume`
- 外部命令：`exec`（统一跨平台行为与返回结构）

## 关键规则
- 路径统一走 `normalizePath`：支持 `./` `.` `~` `..` `!`；空/空白返回 `''`
- `glob` 默认 `absolute: true` + `dot: true`，返回可复用 `ListSource`
- 基于 glob 的 API 在无匹配时通常会回显并早返回：`copy/remove/clean/backup/recover/read/stat`
- `echo` 会将路径渲染为 `root->.` `home->~`，并高亮 `**xx**`

## 文件操作
- `copy(source, target?, options?)` -> `Promise<void>`
  - `source`: `string | string[]`，内部 `glob(..., { onlyFiles: true })`
  - `target`: `string | (dirname) => string | Promise<string>`
  - `options`: `string | (filename) => string | Promise<string> | { concurrency?, filename?, echo? }`
  - 同目录复制默认后缀 `.copy`
- `write(path, content, options?)` -> `Promise<void>`
  - 自动建目录，支持 `string/Buffer/ArrayBuffer/TypedArray/Blob/object(JSON)`
- `read(path, { raw? })` -> `Promise<unknown | undefined>`
  - `glob(..., { onlyFiles: true })` 后取首个匹配
  - 文本扩展返回 `string`；`json/yaml` 返回对象；`raw` 返回 `Buffer`
- `mkdir(path | path[], { concurrency? })` -> `Promise<void>`
- `move(source, target, { concurrency? })` -> `Promise<void>`（`copy + remove`）
- `remove(source, { concurrency? })` -> `Promise<void>`（支持目录与通配符）
- `rename(source, basename)` -> `Promise<void>`（basename only）
- `clean(source)` -> `Promise<void>`（删除后继续清理空父目录）
- `stat(path)` -> `Promise<fs.Stats | null>`（无匹配返回 `null`）

## 备份与校验
- `backup(source, { concurrency? })` -> `Promise<void>`（写入 `.bak`）
- `recover(source, { concurrency? })` -> `Promise<void>`（读 `${src}.bak` -> 写回 -> 删除）
- `isExist(...paths)` -> `Promise<boolean>`
  - 路径中包含 `*` 会抛错
  - 其他无效路径或不存在路径返回 `false`
- `isSame(...paths)` -> `Promise<boolean>`
  - 需要至少 2 文件；size=0 或读取失败返回 `false`
  - 通过 `Buffer.compare` 判断内容一致性

## 网络/压缩/监听
- `download(url, dir, filename?)` -> `Promise<void>`
  - `url`/`dir` 必填；`filename` 默认 `getFilename(url)`
  - 实现为 `arrayBuffer -> Buffer -> pipeline`，大文件注意内存
- `zip(source, target = '', option = '')` -> `Promise<void>`
  - `option`: `string` filename 或 `{ base?, filename? }`
  - `base/filename` 可推断；进度输出用 `console.log + renderPath`
- `watch(listSource, callback, { debounce? })` -> `unwatch`
  - 基于 `chokidar@^5`，仅监听 `change`，不支持 glob，默认 debounce 1000ms

## 并发/CLI/工具
- `runConcurrent(concurrency, tasks, { stopOnError? })` -> `Promise<T[]>`
  - 结果保序；`stopOnError=true` 早停；默认聚合错误并抛 `AggregateError`
- `exec(cmd, { echo?, silent? })` -> `Promise<[exitCode, lastOutput, allOutputs]>`
  - Windows 用 PowerShell，其他平台用 `/bin/sh`；数组命令以 `; ` 串联
- `prompt(options)` -> `Promise`
  - `id` 缓存到 `./temp/cache-prompt.json`；`multi` 类型不缓存
- `run(fn)` -> `fn()` 的返回值
- 其他：`argv/at/findIndex/flatten/toArray/toDate/trimEnd/wrapList/os/root/home/getName*`

## 原生替代速查
| 原生 API | fire-keeper | 备注 |
| --- | --- | --- |
| `fs.readFileSync` | `read(path)` | 自动解析 JSON/YAML，支持 glob |
| `fs.writeFileSync` | `write(path, content)` | 自动创建目录 |
| `fs.copyFileSync` | `copy(src, target)` | 支持 glob 与 `.copy` 默认规则 |
| `fs.rmSync` | `remove(source)` | 支持目录/通配符 |
| `fs.statSync` | `stat(path)` | 无匹配返回 `null` |
| `path.normalize` | `normalizePath(path)` | 统一 `./` `~` `..` `!` 语义 |
| `child_process.exec` | `exec(cmd)` | 跨平台 shell + tuple 输出 |
| `Promise.all` | `runConcurrent(n, tasks)` | 限流 + 保序 + 错误策略 |
