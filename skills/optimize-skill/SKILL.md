---
name: optimize-skill
description: 创建或优化 skill 文件，use when creating/updating/refactoring/optimizing skill files
allowed-tools: Read, Glob, Write, Edit, Bash
---

# Skill 优化器

## 何时使用
- 创建/优化/重构 `SKILL.md`
- 将项目规则沉淀为可复用 skill
- 批量统一多个 skill 的结构与触发语义

## 核心意图
用统一骨架保持 skill 可触发、可维护、可验证。

## 效率优先
Read/Glob/Write/Edit/Bash > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. `SKILL.md <=100` 行，辅助文档 `<=200` 行
2. `name` 用小写连字符且 `<=64` 字符
3. `description` 为一句中文 + 英文触发词，`<=256` 字符
4. 仅保留项目特定知识；删除重复/矛盾/歧义
5. 新增或改名必须检查触发词冲突
6. 附件（`example.md/references/*`）与主文结构、返回格式、触发语义一致
7. 规则分层：`optimize-skill` 的元规则仅约束优化过程；禁止无条件写入目标 skill
8. 适用性优先：仅当目标目录真实存在对应附件时，才写入附件一致性条款
9. 批量防扩散：先建“规则-文件适用矩阵”，未命中规则不得落入该文件

## 输入/输出契约
- 输入：目标路径/范围、目标约束、是否允许拆分附件
- 输出：变更摘要 + `wc -l` + 状态
- 成功：`✓ skill 优化完成`
- 失败：`✗ 原因`

## 工作流程
1. 确认需求：单文件直接改；复杂场景先走 `plan-implementation`
2. 定位文件：`~/.claude/skills/{name}/SKILL.md` 与 `.claude/skills/{name}/SKILL.md`
3. 冲突检查：扫描现有 `name/description/use when`
4. 生成适用矩阵：逐文件标记哪些规则可写入（含附件规则）
5. 生成骨架：frontmatter + 何时使用/核心意图/效率优先/约束/契约/流程
6. 编写内容：保持原触发语义，符号压缩 `·/→`
7. 一次性 Edit：批量完成写回
8. 验证：`wc -l`、检查清单、附件一致性；批量时反向 `rg` 排查误扩散条款
9. 超限处理：先压缩；仍超则拆分 references/examples/scripts
10. 返回信息：输出状态

## 检查清单
- [ ] frontmatter 与描述格式合规
- [ ] 含核心意图/效率优先/流程/返回信息
- [ ] 触发语义兼容且无冲突
- [ ] 行数合规并输出 `wc -l`
- [ ] 附件规则仅出现在存在附件的目标 skill
- [ ] 批量修改已做误扩散反查（`rg`）
