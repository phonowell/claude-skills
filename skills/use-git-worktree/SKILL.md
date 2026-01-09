---
name: use-git-worktree
description: 指导使用 git worktree 管理多分支并行开发，use when working on multiple branches simultaneously or switching contexts frequently
allowed-tools: Bash, Read, Write, Edit
---

# Git Worktree 使用指南

## 何时使用

- 需同时修改多个分支（如 feature + hotfix）
- 频繁切换分支导致 stash 混乱
- 长期分支需保持独立工作目录
- 避免 `git switch/checkout` 造成的上下文丢失

**核心意图**：通过 worktree 实现多分支并行开发，避免切换分支导致的工作丢失和上下文切换开销

**核心约束**：禁用 `git switch/checkout` 切换分支 · 合并需 squash 单 commit · 完成后清理 worktree

## 核心命令

| 操作 | 命令 |
|------|------|
| 创建 | `git worktree add ../<dir> <branch>` |
| 新建分支 | `git worktree add -b <new-branch> ../<dir> <base>` |
| 列出 | `git worktree list` |
| 删除 | `git worktree remove ../<dir>` |
| 清理 | `git worktree prune` |

## 工作流程

### 1. 创建 worktree

**有未提交变更时**：
```bash
git stash                                                # 暂存变更
git worktree add ../project-feature feature-branch       # 创建 worktree
git stash pop                                            # 还原变更到当前分支
```

**无变更时**：
```bash
git worktree add ../project-feature feature-branch       # 现有分支
git worktree add -b hotfix-123 ../project-hotfix main    # 新建分支
```

**路径规范**：`../<project>-<branch-suffix>` · 与主目录同级

### 2. 并行工作

- 每个 worktree 独立目录，互不干扰
- 可同时在不同 worktree 执行命令
- IDE 可同时打开多个 worktree

### 3. 合并回主分支（squash 单 commit）

```bash
# 1. 在 feature worktree 确认无未提交变更
cd ../project-feature && git status

# 2. 切到主 worktree 执行 squash 合并
cd ../project-main
git merge --squash feature-branch
git commit -m "feat: 功能描述"

# 3. 推送主分支
git push origin main
```

**要点**：`--squash` 将所有 commits 压缩为一个 · 合并后 feature 分支不会显示为已合并

### 4. 安全清理（强制流程）

```bash
# 1. 确认变更已在主分支（对比 diff 应为空）
git diff main...feature-branch

# 2. 删除远程分支（如有）
git push origin --delete feature-branch

# 3. 删除 worktree
git worktree remove ../project-feature

# 4. 删除本地分支
git branch -D feature-branch

# 5. 清理悬空记录
git worktree prune
```

**检查清单**：[ ] 变更已合并到主分支 [ ] 远程分支已删除 [ ] worktree 已移除 [ ] 本地分支已删除

## 注意事项

- 同一分支不能在多个 worktree 中检出 · squash 后需 `git branch -D` 强制删除
- 共享 `.git` 目录：stash/config 全局可见

## 返回信息

输出 worktree 操作结果或错误信息
