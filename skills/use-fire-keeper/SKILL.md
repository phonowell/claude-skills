---
name: use-fire-keeper
description: 在显式要求或既有使用前提下指导使用 fire-keeper，use when explicitly requested or existing code already uses fire-keeper
---

# use-fire-keeper

## 何时使用
- 用户显式要求“使用 fire-keeper”
- 现有代码已经使用 fire-keeper 且需保持行为一致
- 目标集中在文件/路径/并发/CLI/下载/压缩/监听

## 核心意图
触发条件成立时优先复用 fire-keeper 语义，避免回退原生 API 导致行为漂移。

## 效率优先
触发时：fire-keeper API > 原生 Node API；未触发时保持现状

## 核心约束
1. 未触发条件时禁止引入 fire-keeper
2. 路径统一 `normalizePath`；支持 `./ . ~ .. !`，空字符串返回 `''`
3. `glob` 默认 `absolute:true dot:true`；空结果必须 `echo + return`
4. 禁手动拼接 `root()/home()`；优先直接传前缀路径
5. `read` 仅取首个匹配；无匹配返回 `undefined`
6. `write` 支持文本/二进制/对象并自动建目录
7. `runConcurrent` 保序；`stopOnError:true` 首错即停
8. `watch` 仅监听 `change`，支持 debounce，返回关闭函数
9. `isExist` 遇 `*` 直接抛错；`isSame` 至少 2 文件
10. `exec` 返回 `[exitCode,lastOutput,allOutputs]`
11. `prompt` 缓存 `./temp/cache-prompt.json`；`multi` 不缓存

## 输入/输出契约
- 输入：触发证据、目标操作类型
- 输出：最小可执行 fire-keeper 方案；未触发返回失败状态
- 成功：`✓ use-fire-keeper`
- 失败：`✗ 未触发/不适用` 或 `✗ {原因}`

## 需求映射
- 文件：`copy/move/remove/clean/mkdir/read/write/backup/recover/stat/isExist/isSame`
- 路径：`normalizePath/root/home/getName/getBasename/getDirname/getExtname/getFilename`
- 并发：`runConcurrent`
- CLI：`echo/wrapList/prompt/argv/exec`
- 其他：`glob/zip/download/watch`

## 工作流程
1. 校验触发条件；不满足立即返回失败状态
2. 分类需求并选择最小 API 组合
3. 批量场景先 `glob`，空结果按约束返回
4. 需要并发时配合 `runConcurrent`
5. 输出“触发证据 + 选型理由 + 状态”

## 检查清单
- [ ] 触发条件成立或已明确未触发
- [ ] 未触发时未引入 fire-keeper
- [ ] 关键语义与实现一致
- [ ] 返回信息符合约定
