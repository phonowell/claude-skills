---
name: code-reviewer
description: Review code changes for bugs, regressions, missing tests, and over-complex edits, then tighten or fix them before merge. Use this skill whenever the user asks for a review, asks whether changes are safe to merge, wants a diff or PR checked, or after meaningful code edits that need a quality pass instead of a generic summary.
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# 代码修改复盘验证

通过多轮检查和自动修复，阻断低质量改动进入主分支。

## 触发边界
- 用户要求 review、检查 diff、确认是否可合并
- 代码改动完成后执行质量复盘
- 默认只看用户指定范围或最近 diff

## 工作流程
1. 先读 `references/preflight.md`，明确目标、范围、风险、可用验证命令
2. 锁定评审对象：优先 `git diff`，其次用户指定文件或目录
3. 统计改动规模；总改动超过 500 行时按模块分批闭环
4. 按 `references/review-checklist.md` 做真实性、正确性、优雅性、最小化四维复盘
5. 发现问题先修再继续；不要等待人工确认，也不要顺手引入新需求
6. 末轮执行必要验证；无法执行时明确说明原因
7. 输出前再读 `references/output-template.md`，保证格式与严重度映射一致

## 资源入口
- `references/preflight.md`：开始前必读
- `references/review-checklist.md`：进入逐项复盘时读
- `references/output-template.md`：最终答复前读，不要整份背进上下文

## 输出契约
- 输入：`git diff` 或指定范围、规范来源、可用测试命令
- 输出：按模板给出问题、位置、修复动作、验证、残余风险
- 成功：`✓ 代码复盘完成，满足所有质量要求`
- 失败：`✗ 复盘中断：{原因}`

## 约束
1. 范围仅限用户指定区域或最近 diff
2. 每个问题必须给出文件位置与修复建议
3. 结构治理：>200 行评估拆分必要性，文件大小本身不是合并理由——职责单一的小文件优于强制合并
4. 分级：P0 阻塞、P1 合并前修复、P2 本轮修复或登记、P3 可选
5. 冲突时优先级：本文件约束 > `review-checklist` > 示例

## 检查清单
- [ ] 范围与风险已预检
- [ ] 大改动已分批闭环
- [ ] 问题有位置、有建议、有修复
- [ ] 严重度映射与输出模板一致
- [ ] 已执行必要验证或说明未执行原因
