# Task Plan: Folder-level skill symlink mirroring

## Goal
Replace file-copy sync with per-folder symlink mirroring from `./skills` to
`~/.claude/skills`, `~/.codex/skills`, `~/.cursor/skills`, `~/.trae-cn/skills`,
including legacy cleanup for symlinked `skills` dirs and copied folders.

## Phases
- [x] Phase 1: Inspect current sync/link logic and tests; confirm scope/edge cases
- [x] Phase 2: Refactor `src/index.ts` to link each skill folder (win32 junction)
- [x] Phase 3: Update tests for folder-level linking and legacy cleanup
- [x] Phase 4: Run `pnpm lint` + `pnpm exec tsc` (+ `pnpm test` if needed)

## Key Questions
1. Should we delete target folders not present in `./skills`, or leave them?
2. Should hidden folders (for example `.claude`) be linked or skipped?
3. Should legacy copied folders be removed or backed up before linking?

## Decisions Made
- Use fire-keeper for stat/mkdir/remove/glob/path helpers; use `node:fs/promises`
  only for `lstat/readlink/symlink`.
- One-way mirroring: local `./skills` is the source of truth.
- Normalize win32 `readlink` outputs before comparisons.
- Cleanup policy: remove only entries that collide with source folders; no backups.
- Skip hidden directories under `./skills`.

## Errors Encountered
- None yet

## Status
**Completed** - Lint and type check executed

---

# Task Plan: 优化 skills 中的 skill

## Goal
优化 skills 中的 skill，全面提升执行效果（不限于稳定度、目标达成、注意力保持），并使用 opencode 测试验证

## Phases
- [ ] Phase 1: 分析现有 skills 的问题和改进点
- [ ] Phase 2: 制定优化方案（按 skill 分类）
- [ ] Phase 3: 执行优化（手动，不委托）
- [ ] Phase 4: 使用 opencode 测试验证优化效果

## Key Questions
1. 哪些 skills 存在冗余、歧义或低效问题？
2. 如何统一优化标准（行数、描述、工作流程）？
3. 如何用 opencode 测试验证优化后的 skills？
4. 执行效果的哪些方面需要优化？（不限于稳定度、目标达成、注意力保持）

## Decisions Made
- 优化目标：全面提升执行效果（不限于稳定度、目标达成、注意力保持）
- 优化范围：所有 skills（排除 agent-browser，作为参考标准）
- 验证方式：使用 opencode 测试
- 委托策略：否（手动优化，不委托给 OpenCode subagent）
- 优化标准：遵循 optimize-skill 和 optimize-docs 的约束
- 参考标准：agent-browser/SKILL.md 作为优秀实现，其他 skills 应参考其结构

## Errors Encountered
- None yet

## Analysis Results

### 行数统计（目标 ≤100 行）
- ✅ skills/optimize-claude-md/SKILL.md: 66 行
- ✅ skills/review-dialogue-quality/SKILL.md: 76 行
- ✅ skills/invoke-opencode-acp/SKILL.md: 77 行
- ✅ skills/use-fire-keeper/SKILL.md: 69 行
- ✅ skills/optimize-skill/SKILL.md: 81 行
- ✅ skills/plan-implementation/SKILL.md: 82 行
- ✅ skills/optimize-docs/SKILL.md: 84 行
- ✅ skills/review-code-changes/SKILL.md: 84 行
- ✅ skills/use-git-worktree/SKILL.md: 100 行
- ✅ skills/agent-browser/SKILL.md: 143 行（排除优化，作为参考标准）

### 问题识别
1. **通用问题**：部分 skills 缺少"返回信息"步骤的明确说明
2. **格式一致性**：description 格式需要统一检查
3. **执行效果**：需要全面提升（不限于稳定度、目标达成、注意力保持）
4. **参考标准**：agent-browser/SKILL.md 作为优秀实现，其他 skills 应参考其结构

## Optimization Plan

### 优先级 P0: 格式统一（排除 agent-browser）

**检查项：**
1. **description 格式**：所有 SKILL.md 需要统一为"中文功能说明 + 英文触发词"
2. **返回信息步骤**：确保每个 skill 都有明确的"返回信息"步骤
3. **何时使用**：统一触发场景的表述
4. **核心意图**：统一核心问题的表述

**需要检查的 skills（排除 agent-browser）：**
- optimize-claude-md/SKILL.md
- review-dialogue-quality/SKILL.md
- invoke-opencode-acp/SKILL.md
- use-fire-keeper/SKILL.md
- optimize-skill/SKILL.md
- plan-implementation/SKILL.md
- optimize-docs/SKILL.md
- review-code-changes/SKILL.md
- use-git-worktree/SKILL.md

### 优先级 P1: 提升执行效果（排除 agent-browser）

**优化维度：**
1. **增强稳定度**：
   - 明确错误处理和边界情况
   - 添加注意事项和限制说明
   - 标注已知问题和解决方案

2. **提升目标达成**：
   - 细化工作流程步骤
   - 添加检查清单
   - 明确成功标准

3. **保持注意力**：
   - 优化结构，减少认知负担
   - 使用符号分隔（·→/）
   - 合并同类项

4. **提升清晰度**：
   - 减少歧义，提升可读性
   - 统一术语和命名
   - 添加代码示例

5. **补充内容**：
   - 添加缺失的步骤或说明
   - 补充示例和用例
   - 添加辅助文档链接

**具体实施：**
- 每个 skill 至少添加 1 个注意事项
- 每个 skill 至少添加 1 个错误处理说明
- 每个 skill 至少添加 1 个检查清单项

**参考标准（agent-browser）：**
- 结构清晰：Quick start → Core workflow → Commands → Examples
- 内容完整：包含所有命令和示例
- 格式规范：使用代码块和注释
- 其他 skills 应参考此结构进行优化

## Status
**Currently in Phase 2** - 制定优化方案（按 skill 分类）
