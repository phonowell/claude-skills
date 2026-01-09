---
name: optimize-skill
description: 创建或优化 skill 文件，use when creating/updating/refactoring/optimizing skill files
allowed-tools: Read, Glob, Write, Edit, Bash
---

# Skill 优化器

## 何时使用

- 创建/优化/重构 skill 文件（含任何 SKILL.md 读写操作）
- 将项目知识或工作流沉淀为可复用 skill

**核心意图**：将项目知识结构化为可复用 skill，确保格式规范、内容精准、易于触发

**效率优先**：Read/Glob/Write/Edit/Bash > Task · 并行≤3 · 一次性 Edit
**规范叠加**：同时遵守 `optimize-docs` 文档规范 + 本 skill 的 SKILL.md 特定规范

## 核心约束

| 项目 | 限制 |
|------|------|
| SKILL.md | ≤100 行 |
| 辅助文档 | ≤200 行 |
| Name | 动词+名词、小写连字符、≤64 字符 |
| Description | 一句中文 + 英文触发词、≤256 字符、无位置标注 |

**内容原则**：仅项目特定知识 · 利用上下文 · 合理压缩避免歧义 · 修正错误/矛盾/歧义/遗漏/冗余

## 工作流程

### 1. 确认需求（强制）

调用 `plan-implementation` skill 确认意图（目标/范围/优先级）· 已满足需求时直接告知

### 2. 定位与规划

- **路径识别**：Glob `~/.claude/skills/{name}/SKILL.md` 和 `.claude/skills/{name}/SKILL.md`
- **结构选择**：简单 → 单文件 · 复杂 → SKILL.md + reference/examples/templates
- **工具权限**：只读 `Read Grep Glob` · 文档 `Read Glob Write` · 重构 `Read Grep Glob Edit`

### 3. 编写内容

**结构模板**：

```
Frontmatter: name + description
何时使用：触发场景
核心意图：skill 要解决的核心问题（优化 tokens/时间/质量等）
效率优先：直接工具优于 subagent
核心约束：项目逻辑
工作流程：1.确认需求(强制) 2.自定义步骤... N.返回信息
示例：实际案例（可选）
```

**Description 写作规则**：

- 格式：`中文功能说明 + 使用时机（英文触发词）`· 一句话，不能用句号分隔 · 不含位置标注
- ✅ `重构 React 组件遵循项目规范，use when splitting large files or enforcing code style rules`
- ❌ `功能A。功能B`（句号分隔）· `重构组件，use when... (project)`（含位置标注）

### 4. 执行修改

1. Write 前压缩：符号分隔（·）· 列表化 · 合并同类项 · 目标 ≤80 行
2. 一次性 Edit：分析所有修改点后批量完成

### 5. 验证

- `wc -l` 检查行数 ≤100
- 清单：[ ] Frontmatter 完整 [ ] name/description 规范 [ ] 含核心意图 [ ] 仅项目知识 [ ] 含返回信息步骤
- **复用 Edit 返回的 cat -n，禁止重复 Read**

### 6. 超限处理

① `optimize-docs` 压缩 → ② 拆分：详细 → reference.md · 示例 → examples.md

### 7. 返回信息

输出简短状态："✓ skill 优化完成" 或 "✗ 中断原因"
