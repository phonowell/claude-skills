# API 参考（use-fire-keeper）

## 高频映射
- 文件批处理：`glob -> echo + return -> runConcurrent`
- 文件读写：`read/write`
- 路径归一：`normalizePath`
- 日志与静默：`echo + freeze/whisper/pause/resume`
- 外部命令：`exec`
- 包子路径导入：`fire-keeper/backup`；仓库内相对导入才写 `.js`

## 关键规则
- 路径统一走 `normalizePath`：支持 `./` `.` `~` `..` `!`；空/空白返回 `''`
- `glob` 默认 `absolute: true` + `dot: true`，返回可复用 `ListSource`
- 目录筛选选项是 `onlyDirectories`
- 基于 glob 的 API 无匹配通常会回显并早返回：`copy/remove/clean/backup/recover/read/stat`
- `echo` 会把项目根渲染为 `.`、主目录渲染为 `~`

## 文件操作
- `copy(source, target?, options?)`
  - 支持文件、glob、直传目录路径
  - 同目录复制默认后缀 `.copy`
- `write(path, content, options?)`
  - 自动建目录，支持 `string/Buffer/ArrayBuffer/TypedArray/Blob/object`
- `read(path, { raw? })`
  - `glob(..., { onlyFiles: true })` 后只取首个匹配
- `move(source, target)` -> `copy + remove`
- `remove(source)` 支持目录与通配符
- `rename(source, basename)` 只改 basename
- `clean(source)` 删除后继续清理空父目录
- `stat(path)` 无匹配返回 `null`

## 备份与校验
- `backup(source)` 写入 `.bak`
- `recover(source)` 从 `${source}.bak` 写回，并只移除末尾备份后缀
- `isExist(...paths)` 遇 `*` 直接抛错
- `isSame(...paths)` 需要至少 2 文件

## 网络/压缩/监听
- `download(url, dir, filename?)`
  - `url/dir` 必填
  - 优先消费响应流；无可用流时才回退 `arrayBuffer`
- `zip(source, target, option?)`
  - `option` 可为 filename 或 `{ base?, filename? }`
- `watch(listSource, callback, { debounce? })`
  - 基于 `chokidar@^5`
  - 仅监听 `change`
  - 不支持直接传 glob，需先 `glob`

## 并发/CLI/工具
- `runConcurrent(concurrency, tasks, { stopOnError? })`
  - 结果保序；默认聚合错误；`stopOnError: true` 首错即停
- `exec(cmd, { echo?, silent? })`
  - 返回 `[exitCode, lastOutput, allOutputs]`
  - 数组命令按顺序执行，首个非零退出码立即返回
- `prompt(options)`
  - `id` 缓存到 `./temp/cache-prompt.json`
  - `multi` 类型不缓存
- 其他：`argv/at/findIndex/flatten/toArray/toDate/trimEnd/wrapList/os/root/home/getName*`
