---
name: use-fire-keeper
description: 在显式要求或既有使用前提下指导使用 fire-keeper，use when explicitly requested or existing code already uses fire-keeper
---

# use-fire-keeper

## 何时使用
- 用户显式要求“使用 fire-keeper”
- 现有代码已经依赖 `fire-keeper`
- 需求集中在文件、路径、并发、CLI、下载、压缩、监听

## 核心意图
触发成立时优先复用 fire-keeper 语义，避免回退原生 API 导致行为、日志与错误处理漂移。

## 效率优先
- 已触发：优先 fire-keeper API，再补原生 Node API
- 未触发：保持现状，禁止硬引入 fire-keeper

## 核心约束
1. 未触发时禁止新增 `fire-keeper`
2. 包子路径导入写 `fire-keeper/backup`，不要写 `fire-keeper/backup.js`
3. 仓库内相对导入仍需保留 `.js`
4. 路径优先 `normalizePath`；不要手动拼 `root()/home()`
5. 批量场景优先 `glob`；无匹配时按模块语义 `echo + return`
6. `glob` 目录选项用 `onlyDirectories`，不是 `onlyDirs`
7. `copy` 支持文件、glob，也支持直传目录路径递归复制
8. `download` 先校验 `url/dir`，再优先消费响应流；仅必要时回退 `arrayBuffer`
9. `exec` 返回 `[exitCode, lastOutput, allOutputs]`；数组命令按顺序执行，首错即停
10. `watch` 只监听 `change`；chokidar v4+ 不支持直接传 glob，需先 `glob`
11. `runConcurrent` 保序；`stopOnError: true` 首错即停
12. 需要细节时再读 `reference.md` 与 `examples.md`

## 输入/输出契约
- 输入：触发证据、目标操作、是否已有 fire-keeper 代码
- 输出：最小可执行 fire-keeper 方案；未触发时明确拒绝
- 成功：`✓ use-fire-keeper`
- 失败：`✗ 未触发/不适用` 或 `✗ {原因}`

## 需求映射
- 文件：`copy/move/remove/clean/mkdir/read/write/backup/recover/stat/isExist/isSame`
- 路径：`normalizePath/root/home/getName/getBasename/getDirname/getExtname/getFilename`
- 并发：`runConcurrent`
- CLI：`echo/wrapList/prompt/argv/exec`
- 其他：`glob/zip/download/watch`

## 工作流程
1. 校验是否命中触发条件；未命中立即返回失败状态
2. 按需求类型选择最小 API 组合
3. 批量或监听 glob 先 `glob`；空结果按模块约束返回
4. 需要并发时再接 `runConcurrent`
5. 输出“触发证据 + 选型理由 + 最小方案 + 状态”

## 检查清单
- [ ] 触发条件已成立或已明确未触发
- [ ] 包子路径导入未误写 `.js`
- [ ] `watch/glob/exec/download` 语义与当前实现一致
- [ ] 返回信息符合约定
