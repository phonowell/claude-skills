---
name: use-fire-keeper
description: 在显式要求或既有使用前提下指导使用 fire-keeper，use when explicitly requested or existing code already uses fire-keeper
---

# use-fire-keeper

## 何时使用
- 用户显式要求“用 fire-keeper”
- 现有代码已在使用 fire-keeper（保持栈一致）
- 需求集中在文件/路径/并发/日志/CLI/下载/压缩/监听，且依赖项目既有行为
- 反例：既未被要求且现有代码未使用 fire-keeper 时，不为“统一风格”主动引入

## 核心意图
触发条件成立时，优先复用 fire-keeper 的项目特定语义，避免退回原生 API 造成行为漂移

## 效率优先
触发条件成立：fire-keeper API > 原生 Node.js API；未触发：保持现状，不新增依赖

## 核心约束
- 未显式要求且代码未使用时，不引入 fire-keeper
- 路径统一走 `normalizePath`：支持 `./` `.` `~` `..` `!`；空/空白返回 `''`；自动归一化为绝对路径并转 `/`
- 禁手动拼接 `root()/home()`；优先直接传 `./` `~` 前缀路径
- `glob` 默认 `absolute: true` `dot: true`，返回品牌 `ListSource`（`__IS_LISTED_AS_SOURCE__`）可直接复用
- 无匹配统一：`echo(tag, \`no files found matching ${wrapList(source)}\`)` + 早返回
- `copy` 同目录默认 `.copy`；`target`/`filename` 支持 string 与函数；支持并发
- `remove` 支持目录与通配符；`clean` 在删除后清理空父目录
- `backup/recover` 使用 `.bak`；recover 流程为“读备份→写回原名→删备份”
- `read` 仅取首个匹配；文本扩展返回 string，json/yaml 返回 object，`raw` 返回 Buffer；无匹配返回 `undefined`
- `write` 支持 string/Buffer/ArrayBuffer/TypedArray/Blob/对象(JSON)；自动创建目录
- `runConcurrent` 保序；`stopOnError: true` 首错即停；默认收集后抛 `AggregateError`
- `watch` 基于 `chokidar@^5`；仅监听 `change`；支持 debounce；返回关闭函数
- `exec` 使用 `/bin/sh` 或 PowerShell；数组命令以 `; ` 串联；返回 `[exitCode, lastOutput, allOutputs]`
- `download` 必填 `url` 与 `dir`；实现为 `arrayBuffer -> Buffer -> pipeline`（大文件注意内存）
- `isExist` 若路径含 `*` 直接抛错；其余任一路径无效或不存在返回 `false`
- `isSame` 至少 2 文件；size=0/读取失败返回 `false`；使用 Buffer 比较
- `echo` 简化路径 `root->.` `home->~`；支持 `**xx**` 高亮与 `freeze/whisper/pause/resume`
- `prompt` 缓存 `./temp/cache-prompt.json`；`multi` 类型不缓存

## 输入/输出契约
- 输入：触发证据（显式要求或已有依赖）· 目标操作（文件/路径/并发/CLI/网络/压缩/监听）
- 输出：最小可执行 fire-keeper 方案；未触发则 `✗ 未触发/不适用`

## 需求映射
- 文件：`copy/move/remove/clean/mkdir/read/write/backup/recover/stat/isExist/isSame`
- 路径：`normalizePath/root/home/getName/getBasename/getDirname/getExtname/getFilename`
- 并发：`runConcurrent`
- CLI/交互：`echo/wrapList/prompt/argv/exec`
- 其他：`glob/zip/download/watch`

## 工作流程
1. 校验触发：显式要求或现有代码已使用；否则返回 `✗ 未触发`
2. 分类需求：文件/路径/并发/CLI/网络/压缩/监听
3. 从“需求映射”中选择最小 API 组合，优先已有调用模式
4. 批量场景：先 `glob`，空结果按约束 `echo + return`，再配合 `runConcurrent`
5. 输出策略：默认 `echo`；临时静默用 `freeze/whisper/pause/resume`
6. 返回信息：`✓ use-fire-keeper` 或 `✗ {原因}`

## 注意事项
- `glob` 结果通常已绝对化，后续 API 可直接消费，避免重复 `normalizePath`
- `zip` 会推断 `base/filename`，进度使用 `console.log`（不是 `echo`）
- 回答中给出“触发证据 + 选型理由 + 返回信息”，避免只给 API 名称

## 检查清单
- [ ] 触发条件成立或已返回未触发
- [ ] 未引入未触发的 fire-keeper
- [ ] 关键语义与实现一致（尤其 `watch/isExist/read/write/runConcurrent`）
- [ ] 返回信息符合约定
