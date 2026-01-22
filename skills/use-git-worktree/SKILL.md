---
name: use-git-worktree
description: 指导使用 git worktree 管理多分支并行开发，use when working on multiple branches simultaneously or switching contexts frequently
allowed-tools: Bash, Read, Write, Edit
---

# Git Worktree 使用指南

## 何时使用
- 并行处理多个分支（feature + hotfix）
- 频繁切分支导致 stash/上下文冲突
- 需要长期分支独立目录或多 agent 并行

## 核心意图
通过 worktree 为每个分支提供独立工作目录，降低切分支成本并支持并行会话。

## 效率优先
`git worktree add/list/remove` > 手动复制目录/频繁 `git switch`；重复流程可脚本化。

## 核心约束
- 并行场景不使用 `git switch/checkout` 切分支
- 合并使用 `git merge --squash` 保持单 commit
- 同一分支不能在多个 worktree 中检出
- 完成后必须清理 worktree/分支/记录

## 输入/输出契约
- 输入：目标分支名、新分支名、工作目录命名规则
- 输出：worktree 路径与对应分支、清理状态

## 工作流程
1. 预检：`git status` 确认干净；确定 base 分支与目录名（建议 `../<repo>-<branch>`）。
2. 创建：
   - 现有分支：`git worktree add ../repo-feature feature`
   - 新分支：`git worktree add -b hotfix-123 ../repo-hotfix main`
3. 并行工作：各 worktree 独立目录；可多 IDE 同开；如需重复创建，脚本化“创建→复制配置→安装依赖”。
4. 合并回主分支：
   - `cd ../repo-feature && git status`
   - `cd ../repo-main && git merge --squash feature`
   - `git commit -m "feat: ..."` · `git push origin main`
5. 安全清理：
   - `git diff main...feature` 确认无差异
   - `git push origin --delete feature`（如有）
   - `git worktree remove ../repo-feature`
   - `git branch -D feature`
   - `git worktree prune`
   - 检查清单：[ ] 合并完成 [ ] 远程分支删除 [ ] worktree 移除 [ ] 本地分支删除
6. 返回信息：输出 `✓ worktree add ../repo-hotfix-123 (branch hotfix-123)` 或 `✗ clean failed: local branch not deleted`

## 注意事项
- `.git` 目录共享：stash/config 全局可见
