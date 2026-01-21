# API 参考

## 关键规则
- 路径统一走 normalizePath：支持 `./` `.` `~` `..` `!` 前缀，空/空白返回 ''
- `glob` 默认 `absolute: true` `dot: true`，返回 `ListSource`（可缓存复用）
- 基于 glob 的 API 无匹配会 echo 并 return/undefined/null：copy/remove/clean/backup/recover/read/stat

## 文件操作
- `copy(source, target?, options?)` → Promise<void>
  - source: string | string[]（glob onlyFiles=true）
  - target: string | (dirname) => string | Promise<string>
  - options: string | (filename) => string | Promise<string> | { concurrency?, filename? }
  - 同目录默认 `.copy`
- `write(path, content, options?)` → Promise<void>
  - 自动创建目录，content 支持 string/Buffer/ArrayBuffer/Blob/对象(JSON)
- `read(path, { raw? })` → Promise<unknown | undefined>
  - glob onlyFiles=true 取首个匹配
  - 文本扩展→string；json/yaml→object；raw→Buffer；无匹配→undefined
- `mkdir(path | path[], { concurrency? })` → Promise<void>
  - normalizePath + ensureDir；空输入直接返回
- `move(source, target, { concurrency? })` → Promise<void>
  - copy + remove
- `remove(source, { concurrency? })` → Promise<void>
  - glob onlyFiles=false
- `rename(source, basename)` → Promise<void>
  - basename only
- `clean(source)` → Promise<void>
  - remove 后清理空父目录
- `stat(path)` → Promise<fs.Stats | null>
  - glob onlyFiles=false；无匹配→null

## 备份与校验
- `backup(source, { concurrency? })` → Promise<void>
  - 生成 `.bak`，glob onlyFiles=true
- `recover(source, { concurrency? })` → Promise<void>
  - 读取 `${src}.bak` → 写回 → 删除
- `isExist(...paths)` → Promise<boolean>
  - 禁 `*`；任一路径非法/不存在→false
- `isSame(...paths)` → Promise<boolean>
  - 需 ≥2 文件；size=0 或读取失败→false；Buffer.compare

## 网络/压缩/监听
- `download(url, dir, filename?)` → Promise<void>
  - filename 默认 `getFilename(url)`；空 url 会在默认参数处抛错
  - arrayBuffer→Buffer→pipeline；自动建目录
- `zip(source, target = '', option = '')` → Promise<void>
  - option: string filename | { base?, filename? }
  - base/filename 自动推断；进度用 console.log + renderPath
- `watch(listSource, callback, { debounce? })` → unwatch
  - debounce 默认 1000ms；仅 change；不支持 glob

## 文件匹配
- `glob(input, options?)` → Promise<ListSource>
  - input: string | string[] | ListSource
  - 空输入→空 ListSource；支持 fast-glob 选项

## 并发控制
- `runConcurrent(concurrency, tasks, { stopOnError? })` → Promise<T[]>
  - 保序；stopOnError=true 早停；默认 AggregateError

## 日志
- `echo(message)` / `echo(type, message)`
  - renderPath 简化 `root→.` `home→~`；`**xx**` 高亮
  - pause/resume/freeze/whisper
- `renderPath(path)` → string

## 路径工具
- `normalizePath(path)` → string
  - 支持 `./` `.` `~` `..` `!`；反斜杠→`/`；trim 尾 `/`
- `root()` → string
  - 校验 cwd（相对/非法字符抛错），Windows 盘符保留
- `home()` → string
  - os.homedir() 正斜杠
- `getName/getBasename/getDirname/getExtname/getFilename`
  - getName 处理 UNC；getExtname('.gitignore') → ''

## 工具函数
- `argv()` → { _: [], $0, ... }
- `prompt(options)` → Promise
  - type: text/confirm/number/select/auto/multi/toggle
  - id 缓存 `./temp/cache-prompt.json`；multi 不缓存
- `wrapList(value)` → string
- `toArray(value)` → Array
- `at(input, ...path)` → value
  - 数组支持负索引；对象支持 dot/多段路径
- `findIndex(array, predicate)` → number
- `flatten(list)` → Array
- `trimEnd(str, chars?)` → string
- `exec(cmd, { silent? })` → Promise<[exitCode, lastOutput, allOutputs]>
  - Windows PowerShell / Unix sh；数组命令用 `; `
- `run(fn)` → Result
- `sleep(ms)` → Promise<void>
  - 负数/NaN 归零；ms>0 输出 echo
- `os()` → 'macos' | 'windows' | 'unknown'
- `toDate(input)` → Date
  - ISO 优先；连字符替换为 `/`；拒绝 <= 1970-01-01

## 替代规则

| 原生 API | fire-keeper | 备注 |
| --- | --- | --- |
| `fs.readFileSync` | `read(path)` | JSON/YAML 自动解析，glob 取首个匹配 |
| `fs.writeFileSync` | `write(path, content)` | 自动创建目录 |
| `fs.mkdirSync` | `mkdir(path)` | Promise + 并发 |
| `fs.copyFileSync` | `copy(src, target)` | 支持 glob + 默认 `.copy` |
| `fs.rmSync` | `remove(source)` | 支持目录/通配符 |
| `fs.statSync` | `stat(path)` | 不存在返回 null |
| `path.normalize` | `normalizePath(path)` | 支持 `./` `~` `..` `!` |
| `process.cwd()` | `root()` | 规范化 + 校验 |
| `os.homedir()` | `home()` | 统一正斜杠 |
| `child_process.exec` | `exec(cmd)` | 跨平台 + 捕获输出 |
| `Promise.all` | `runConcurrent(n, tasks)` | 限流 + 保序 |
