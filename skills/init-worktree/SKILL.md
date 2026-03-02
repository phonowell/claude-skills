---
name: init-worktree
description: 一次性初始化固定槽位 worktree 并注入 wt-rebase/wt-land 命令，use when bootstrapping worktree workflow for a repository
allowed-tools: Bash, Read, Glob, Write, Edit
---

# Worktree 槽位模式

## 何时使用
- 需要固定槽位并行开发：`main` + `worktree-1/2/3`
- 需要一次性安装 `wt-rebase/wt-land` 自动化脚本
- 需要长期保留槽位而非临时 worktree

## 核心意图
一次安装完成脚本落地与命令注入，后续仅运行仓库内命令。

## 效率优先
`node <skill-dir>/scripts/install-worktree.js` 一次安装 > 手工复制与手改 `package.json`

## 核心约束
1. 禁止通过 `git switch/checkout` 在同目录来回切分支
2. `rebase/land` 仅允许在 `worktree-1/2/3`，禁止在 `main`
3. 执行 land 前必须先运行 `review-code-changes`
4. 主仓只做汇总/发布；槽位默认禁推送
5. 合并后保留 worktree/branch，不做 remove
6. 本 skill 仅负责初始化；日常执行 `pnpm run wt-rebase/wt-land`

## 输入/输出契约
- 输入：`repo-root`、`skill-dir`、可选 `target-dir(scripts|tasks)`、`base(main)`
- 输出：脚本路径、命令注入结果、失败点
- 成功：`✓ installed + commands ready`
- 失败：`✗ {步骤}:{原因}`

## 附件映射
- `scripts/install-worktree.js`：安装脚本与 `package.json` 注入
- `scripts/rebase-worktree.js`：槽位 rebase 主干
- `scripts/land-worktree.js`：squash land 与回收 plans
- `scripts/git-utils.js`：git 执行与状态校验

## 工作流程
1. 安装：`node <skill-dir>/scripts/install-worktree.js --repo-root <repo-root> [--target-dir scripts|tasks] [--base main] [--plans-dir plans]`
2. 验证安装：确认 `<repo-root>/{scripts|tasks}/worktree/*.{js|mjs}` 与 `package.json.scripts.wt-*`
3. 初始化槽位：`git -C <repo-root> worktree add -b worktree-{1..3} <repo-root>-worktree-{1..3} main`
4. 日常 rebase：在槽位执行 `pnpm run wt-rebase`
5. 开发完成：先运行 `review-code-changes`，再在槽位执行 `pnpm run wt-land`
6. 发布推送：仅在 `main` worktree 执行
7. 返回信息：输出安装状态

## 检查清单
- [ ] 安装脚本与命令注入成功
- [ ] 仅在槽位执行 `wt-rebase/wt-land`
- [ ] 已在 land 前执行 `review-code-changes`
- [ ] 槽位禁推送策略明确
- [ ] 返回信息符合约定
