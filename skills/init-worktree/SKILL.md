---
name: init-worktree
description: 一次性初始化固定槽位 worktree 并注入 wt-rebase/wt-land 命令，use when bootstrapping worktree workflow for a repository
allowed-tools: Bash, Read, Glob, Write, Edit
---

# Worktree 槽位模式

## 何时使用
- 单仓并行开发：`main` 汇总 + `worktree-1/2/3` 槽位
- 需要一次性安装并脚本化 `rebase/land`，避免手工命令漂移
- 需要固定槽位长期保留，不做临时 worktree

## 核心意图
一次执行完成安装：释放脚本到目标仓库 `tasks/` 或 `scripts/` 并自动写入 `package.json` 的 `wt-rebase/wt-land` 命令。

## 效率优先
`node <skill-dir>/scripts/install-worktree.js` 一次安装 > 手工复制与手工改 `package.json`。

## 核心约束
- 禁在同目录 `git switch/checkout` 来回切分支
- `rebase/land` 仅允许在 `worktree-1/2/3`，禁止在 `main`
- 合并前必须先运行 `review-code-changes` skill
- 主仓仅汇总/发布；槽位默认禁推送
- 槽位长期保留：合并后不 remove worktree/branch
- 本 skill 为一次性安装；后续日常仅执行仓库内 `pnpm run wt-rebase/wt-land`

## 输入/输出契约
- 输入：`<repo-root>`、`<skill-dir>`、可选 `target-dir(scripts|tasks)`、base 分支（默认 `main`）
- 输出：脚本释放路径、`package.json` 新增命令、失败点
- 成功：`✓ installed + commands ready`（含安装目录与命令名）
- 失败：`✗ {步骤}:{原因}`

## 附件映射
- `scripts/install-worktree.js`：安装脚本，复制 runtime 文件并写入 `package.json`
- `scripts/rebase-worktree.js`：槽位分支 rebase 主干
- `scripts/land-worktree.js`：槽位分支 squash land 到主干并回收 plans
- `scripts/git-utils.js`：git 执行、冲突检测、worktree 解析与 clean 校验

## 工作流程
1. 一次性安装（必须先做）：
   - `node <skill-dir>/scripts/install-worktree.js --repo-root <repo-root> [--target-dir scripts|tasks] [--base main] [--plans-dir plans]`
   - 行为：自动选择释放目录（优先 `scripts`，否则 `tasks`）并复制 `git-utils/rebase-worktree/land-worktree.{js|mjs}`
   - 行为：`package.json.type=module` 安装 `.js`；否则自动安装 `.mjs`
   - 行为：自动更新 `<repo-root>/package.json`，新增 `wt-rebase` 与 `wt-land` 命令入口
   - 验证：确认 `<repo-root>/{scripts|tasks}/worktree/*.{js|mjs}` 与 `package.json.scripts.wt-*`
2. 初始化槽位（一次）：
   - `git -C <repo-root> worktree add -b worktree-1 <repo-root>-worktree-1 main`
   - `git -C <repo-root> worktree add -b worktree-2 <repo-root>-worktree-2 main`
   - `git -C <repo-root> worktree add -b worktree-3 <repo-root>-worktree-3 main`
3. 日常 rebase（在槽位执行）：
   - `pnpm run wt-rebase`
   - 行为：校验槽位分支 → 校验 clean/conflict 状态 → `fetch --prune` → `rebase main`
4. 开发完成后 land（在槽位执行）：
   - 先运行 `review-code-changes` skill
   - 再执行 `pnpm run wt-land`
5. land 脚本关键行为：
   - 自动清空 `plans/`
   - 当前槽位不干净则自动提交 `auto: worktree-x YYYY-MM-DD`
   - 定位 `main` worktree 并校验其 clean
   - `main` worktree：`fetch --prune` + `merge --ff-only origin/main`
   - 当前槽位：`rebase main`
   - `main` worktree：`merge --squash worktree-x` + `commit "land(worktree-x): <last-subject>"`
   - 当前槽位：`reset --hard main`
6. 发布与推送：仅在 `main` worktree 执行
7. 返回信息：`✓ installed + commands ready` 或 `✗ {步骤}:{原因}`

## 注意事项
- 冲突时脚本会中断；先手动解决后重跑
- 槽位禁推送：`git -C <worktree-path> config --worktree remote.origin.pushurl disabled://no-push`
- 解除禁推送：`git -C <worktree-path> config --worktree --unset remote.origin.pushurl`
- 目标仓库若非 `"type": "module"`，安装器会自动改为 `.mjs` 脚本
