# API 参考

## 文件操作

### 基础

- `copy(src, target, { filename?, concurrency? })` → Promise
  - 默认并发 5，同目录自动加 `.copy`
  - `filename`: string | (basename) => string
- `write(content, path)` → Promise
  - 自动创建目录
  - content: object | Buffer | Blob | ArrayBuffer
- `read(path, { raw? })` → Promise
  - `.json/.yaml/.yml` 自动解析
  - 文本扩展返回 string
  - `raw: true` 返回 Buffer
- `mkdir(path)` → Promise
  - 递归创建
- `move(src, target)` → Promise
  - copy + remove
- `remove(path, { concurrency? })` → Promise
  - 支持 glob，默认并发 5
- `rename(path, basename)` → Promise
  - 仅接受 basename
- `clean(path)` → Promise
  - 删除空父目录
- `stat(path)` → fs.Stats

### 备份

- `backup(path, { concurrency? })` → Promise
  - 生成 `.bak`，默认并发 5
- `recover(path, { concurrency? })` → Promise
  - 从 `.bak` 恢复并删除备份，默认并发 5

### 网络

- `download(url, target?, options?)` → Promise
  - 自动创建目录，自动检测文件名

### 压缩

- `zip(source, options?)` → Promise
  - 支持 base/filename，进度显示

### 监听

- `watch(source, callback, { debounce? })` → { stop: Function }
  - 默认 debounce 1s
  - 仅监听 change 事件
  - **chokidar v4+ 不支持 glob**

### 检查

- `isExist(path)` → Promise<boolean>
  - 不支持 glob，抛出错误
- `isSame(path1, path2)` → Promise<boolean>
  - 先比较大小，再 Buffer.compare

## 文件匹配

`glob(source, options)` → Promise<ListSource>

- ListSource: 品牌类型 `{ __IS_LISTED_AS_SOURCE__: true, ...string[] }`
- `deep: 1` → 直接文件
- `deep: undefined` → 递归匹配
- 默认 `absolute: true, dot: true`
- 支持所有 fast-glob 选项

## 日志

`echo(tag, message)` / `echo(message)`

- 路径自动简化（`.` 项目根，`~` 主目录）
- 高亮：`**xxx**`（洋红色）
- 静默：
  - `freeze(promise)` → Promise（内部 pause/resume）
  - `whisper(fn)` → 结果（仅暂停）
  - `pause()` / `resume()`
- `renderPath(path)` → string（导出函数）
- **无匹配时**：`echo` 提示 + 早返回（**禁 throw**）

## 并发控制

`runConcurrent(concurrency, tasks, { stopOnError? })` → Promise<Result[]>

- 返回按原始顺序的结果数组
- concurrency 通常 5
- 默认收集所有错误并抛出 AggregateError
- `stopOnError: true` → 遇错立即停止

## 路径工具

- `normalizePath(path)` → string
  - 绝对路径，`~/` → `home()`，`./` → `root()`
  - 支持 `../` 和 `!` 前缀忽略
  - 反斜杠转正斜杠，trim 尾部 `/`
- `root(...paths)` → string
  - 项目根路径，规范化，验证禁止字符，Windows 驱动处理
- `home(...paths)` → string
  - 用户主目录，正斜杠
- `getBasename(path)` → string
  - 无扩展名
- `getDirname(path)` → string
  - 目录路径，当前目录返回 `.`
- `getExtname(path)` → string
  - 含点，`.gitignore` 返回空
- `getFilename(path)` → string
  - 完整文件名
- `getName(path)` → { basename, dirname, extname, filename }
  - 处理 UNC 路径

## 工具函数

- `argv()` → { _: [], $0, ...args }
  - yargs 解析
- `prompt({ type, message, ... })` → Promise
  - type: text/confirm/number/select/auto/multi/toggle
  - 支持 `id` 缓存至 `./temp/cache-prompt.json`
  - multi 不缓存
  - `on/off` 控制 toggle 文本
- `wrapList(items)` → string
  - 逗号 + `**xxx**`，对象 JSON.stringify
- `toArray(value)` → Array
  - 单值转数组
- `at(collection, ...path)` → value
  - 数组正负索引/对象点符号路径/变参路径
  - 基于 radash get
- `findIndex(array, predicate)` → number
  - 遍历数组包括 undefined，返回 -1
- `flatten(array)` → Array
  - 递归扁平化嵌套数组
- `trimEnd(str, chars?)` → string
  - 去除尾部字符，默认空白
  - 支持 `\n\r\t\f\v` 特殊字符，转义正则元字符
- `exec(cmd, { silent? })` → Promise<[exitCode, lastOutput, allOutputs]>
  - 跨平台：Windows PowerShell/Unix sh
  - `silent: true` 禁用输出
- `run(fn)` → Result
  - 立即执行函数并返回结果
- `sleep(ms)` → Promise
  - 延迟毫秒，负数/NaN 转为 0
- `os()` → 'macos' | 'windows' | 'unknown'
  - Linux 为 unknown
- `toDate(input)` → Date
  - 支持 Date/timestamp/字符串
  - 连字符替换为斜杠，ISO 格式优先
  - 拒绝 1970-01-01 之前

## 替代规则

| 原生 API                                  | fire-keeper               | 优势                 |
| ----------------------------------------- | ------------------------- | -------------------- |
| `fs.readFileSync`                         | `read(path)`              | YAML/JSON 自动解析   |
| `fs.writeFileSync`                        | `write(content, path)`    | 自动创建目录         |
| `fs.mkdirSync(path, { recursive: true })` | `mkdir(path)`             | Promise 支持         |
| `fs.copyFileSync`                         | `copy(src, target)`       | Promise 支持         |
| `fs.rmSync`                               | `remove(path)`            | 支持并发             |
| `path.join(process.cwd(), ...)`           | `root(...)`               | 项目根路径           |
| `os.homedir()`                            | `home()`                  | 主目录路径           |
| `path.normalize(path)`                    | `normalizePath(path)`     | 支持 `~`/`./../`     |
| `child_process.exec`                      | `exec(cmd)`               | Promise 封装，跨平台 |
| `Promise.all` 并发                        | `runConcurrent(5, tasks)` | 限流控制             |
