---
name: use-fire-keeper
description: 指导使用 fire-keeper 库函数替代原生 Node.js API，use when performing file operations, path handling, or concurrent task execution
---

# use-fire-keeper

## 何时使用
- 需要用 fire-keeper 替代 fs/path/child_process/os
- 处理批量文件/并发/日志/CLI/下载/压缩/监听
- 需要 ./ . ~ .. ! 前缀解析或路径简化输出

## 核心意图
统一文件/路径/并发/日志行为，复用项目内已验证的边界处理

## 效率优先
fire-keeper API > 原生 Node.js API

## 核心约束
- 路径走 `normalizePath` 规则：支持 ./ . ~ .. ! · 空/空白返回 '' · 自动转绝对 + `/`
- 禁手动 `join(root(), ...)`；直接传 `./` 或 `~` 前缀字符串
- `glob` 默认 `onlyFiles: true` + `dot: true`；目录需 `{ onlyFiles: false }`
- `glob` 返回 `ListSource`（`__IS_LISTED_AS_SOURCE__`），可缓存复用
- 无匹配：`echo(tag, \`no files found matching ${wrapList(source)}\`)` 后 `return`
- `copy` 同目录默认加 `.copy`；target 支持 string/函数；options 支持 filename/concurrency
- `remove` 支持目录/通配符；`clean` 会清理空父目录
- `backup/recover` 统一 `.bak`；recover 读 *.bak → 写回 → 删除
- `read` 只取首个 glob 匹配；文本→string，json/yaml→object，raw→Buffer；无文件返回 undefined
- `write` 支持 string/Buffer/ArrayBuffer/Blob/对象(JSON.stringify)；自动建目录
- `runConcurrent` 保序；`stopOnError=true` 早停；默认抛 `AggregateError`
- `watch`（chokidar v4）不支持 glob；仅 `change`；返回 `unwatch`；支持 debounce
- `exec` 用 `/bin/sh` 或 PowerShell；数组命令用 `; ` 串行；返回 `[code,last,all]`
- `download` 需 url+dir；arrayBuffer→Buffer（大文件注意内存）
- `isExist` 禁 `*`；任一路径无效/不存在→false
- `isSame` 需 ≥2 文件；size=0 或读取失败→false；Buffer 比较
- `echo` 简化路径 `root→.` `home→~`；`**xx**` 高亮；`freeze/whisper/pause/resume`
- `prompt` 缓存 `./temp/cache-prompt.json`（multi 不缓存）

## 工作流程
1. 识别需求类型：文件/路径/并发/CLI/网络/压缩/监听
2. 选 API：文件 `copy/move/remove/clean/mkdir/read/write/backup/recover/stat/isExist/isSame` · 路径 `normalizePath/root/home/getName/getBasename/getDirname/getExtname/getFilename` · 并发 `runConcurrent` · CLI `echo/wrapList/prompt/argv/exec` · 其他 `glob/zip/download/watch`
3. 批量处理：`glob` → 空结果按约束回显并 return → `runConcurrent`
4. 输出策略：默认 `echo`；需静默用 `freeze/whisper/pause/resume`
5. 返回信息：输出 `✓ use-fire-keeper` 或 `✗ {原因}`

## 注意事项
- `glob` 结果已是绝对路径，传入后续 API 无需再拼 root/home
- `zip` 自动推断 `base/filename`；进度用 `console.log`
