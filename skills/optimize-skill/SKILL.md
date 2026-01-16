---
name: optimize-skill
description: 创建或优化 skill 文件，use when creating/updating/refactoring/optimizing skill files
allowed-tools: Read, Glob, Write, Edit, Bash
---

# Skill 优化器

## 何时使用
- 创建/优化/重构 skill 文件（含任何 SKILL.md 读写），use when creating/updating/refactoring/optimizing skill files
- 将项目知识或工作流沉淀为可复用 skill
- 批量提升多个 skill 的一致性（名称/触发词/结构）
**核心意图**：结构化项目知识，确保格式统一、内容精准、易于触发  
**效率优先**：Read/Glob/Write/Edit/Bash > Task · 并行≤3 · 一次性 Edit  
**规范叠加**：同时遵守 `optimize-docs` 文档规范 + 本 SKILL 约束

## 核心约束

| 项目 | 限制 |
|------|------|
| SKILL.md | ≤100 行 |
| 辅助文档 | ≤200 行 |
| Name | 动词+名词、小写连字符、≤64 字符 |
| Description | 一句中文 + 英文触发词、≤256 字符、无位置标注 |

**内容原则**：仅项目特定知识 · 利用上下文 · 合理压缩避免歧义 · 修正错误/矛盾/歧义/遗漏/冗余

## 工作流程

1. 确认需求（强制）：简单（单文件+明确需求）→ `AskUserQuestion`；复杂（多文件/架构决策）→ `plan-implementation`；已满足需求→直接告知
2. 定位与规划：Glob `~/.claude/skills/{name}/SKILL.md` 与 `.claude/skills/{name}/SKILL.md`；简单→单文件，复杂→SKILL.md+reference/examples/templates；批量→先定统一骨架与命名/触发词兼容策略；工具权限按需提权（只读/文档/重构）
3. 编写内容：套用结构模板；描述遵守“中文功能说明 + 英文触发词”一行，不用句号分隔；保持原触发语义不被改写；内容仅项目特定知识，利用上下文压缩
4. 执行修改：先压缩后 Write；一次性 Edit 完成全部修改；符号分隔（·/→）减少行长，目标 ≤80 行
5. 验证/超限处理：`wc -l` 确认 ≤100；清单未通过或超限→先压缩（用 `optimize-docs`），仍超→拆分 reference/examples；禁止重复 Read，复用 Edit 返回的 cat -n；未满足成功标准不得返回完成
6. 返回信息：输出 "✓ skill 优化完成" 或 "✗ 原因"

## 内容模板与示例

**结构模板**
```
Frontmatter: name + description
何时使用：触发场景（含 use when...）
核心意图：skill 要解决的核心问题
效率优先：直接工具优于 subagent
核心约束：项目逻辑
工作流程：1.确认需求(强制) ... N.返回信息
示例：实际案例（可选）
```

**描述压缩示例**
- ✅ `重构 React 组件遵循项目规范，use when splitting large files or enforcing code style rules`
- ❌ `功能A。功能B`（句号分隔） / `重构组件，use when... (project)`（含位置标注）

**最小骨架示例**
```
---
name: data-migration
description: 数据迁移执行手册，use when planning/executing DB migration
---
# Data Migration Playbook
## 何时使用
...
```
- 完整范例：见 `skills/optimize-skill/example.md`

## 注意事项 / 错误处理
- 需求不清先问，不要盲写；复杂场景先走计划再写
- 触发词必须在 description 同行给出；修改描述时保持原触发语义，若改变语义需明确说明
- 缺少返回信息步骤视为未完成；批量优化时确保结构一致且命名/触发词无冲突
- 行数冲突优先压缩，仍超再拆分 reference/examples，保持主文 ≤100
- 只保留项目特定知识，移除泛化/重复/矛盾内容

## 成功标准与自测
- 结构满足模板，含何时使用/核心意图/效率优先/约束/流程/注意/检查清单，且有返回信息步骤
- 描述格式正确，触发语义兼容（更新后仍可覆盖原适用场景）
- 行数合规：主文 ≤100，附属 ≤200；检查清单全部勾选
- 自测：用模板起草一个示例段落，对照清单逐项核对，再运行 `wc -l` 复核

## 检查清单（验证顺序）
- [ ] Frontmatter 完整；name 规则；description 中英格式
- [ ] 含核心意图/效率优先/工作流程/返回信息步骤
- [ ] 仅项目特定知识，条理清晰，符号压缩，结构一致
- [ ] 触发语义兼容，无命名/触发词冲突
- [ ] 行数：SKILL ≤100；附属文档 ≤200
- [ ] 如有超限：已尝试压缩，再拆分 reference/examples
