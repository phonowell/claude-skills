---
name: fire-keeper-guide
description: Guide and enforce correct `fire-keeper` usage in this repository. Use this skill whenever the user explicitly asks for `fire-keeper`, when the target code already imports `fire-keeper`, or when file, path, concurrency, CLI, download, archive, or watcher changes should preserve existing `fire-keeper` semantics instead of drifting to raw Node APIs.
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# Fire Keeper Guide

只有触发成立时才引入 `fire-keeper` 语义，避免仓库实现漂移。

## 触发边界
- 用户显式要求“使用 fire-keeper”
- 现有代码已经依赖 `fire-keeper`
- 需求集中在文件、路径、并发、CLI、下载、压缩、监听

## 工作流程
1. 先给出触发证据；未触发时直接拒绝，不新增 `fire-keeper`
2. 已触发时按需求类型选择最小 API 组合，不先写原生 Node 方案
3. 批量或监听场景先 `glob`；需要并发时再接 `runConcurrent`
4. 只在需要细节时读取附件，不要把整份参考资料提前塞进上下文
5. 输出“触发证据 + 选型理由 + 最小方案 + 状态”

## API 映射
- 文件：`copy/move/remove/clean/mkdir/read/write/backup/recover/stat/isExist/isSame`
- 路径：`normalizePath/root/home/getName/getBasename/getDirname/getExtname/getFilename`
- 并发：`runConcurrent`
- CLI：`echo/wrapList/prompt/argv/exec`
- 其他：`glob/zip/download/watch`

## 资源入口
- `reference.md`：需要参数细节、返回值、边界语义时读
- `examples.md`：需要快速套用调用模式时读
- 先判断是否触发，再决定是否读附件

## 输出契约
- 输入：触发证据、目标操作、是否已有 `fire-keeper` 代码
- 输出：最小可执行 `fire-keeper` 方案；未触发时明确拒绝
- 成功：`✓ fire-keeper-guide`
- 失败：`✗ 未触发/不适用` 或 `✗ {原因}`

## 约束
1. 未触发时禁止新增 `fire-keeper`
2. 包子路径导入写 `fire-keeper/backup`，不要写 `fire-keeper/backup.js`
3. 仓库内相对导入仍需保留 `.js`
4. 路径优先 `normalizePath`；不要手动拼 `root()/home()`
5. `glob` 目录选项用 `onlyDirectories`，不是 `onlyDirs`
6. `watch` 只监听 `change`；chokidar v4+ 不支持直接传 glob，需先 `glob`
7. `exec` 返回 `[exitCode, lastOutput, allOutputs]`；数组命令按顺序执行，首错即停

## 检查清单
- [ ] 触发条件已成立或已明确未触发
- [ ] 包子路径导入未误写 `.js`
- [ ] `watch/glob/exec/download` 语义与当前实现一致
- [ ] 返回信息符合输出契约
