---
name: optimize-skill
description: 创建或优化 skill 文件，use when creating/updating/refactoring/optimizing skill files
allowed-tools: Read, Glob, Write, Edit, Bash
---

# Skill 优化器

## 何时使用

- 创建/优化/重构 skill 文件（含任何 SKILL.md 读写操作）
- 将项目知识或工作流沉淀为可复用 skill

**效率优先**：Read/Glob/Write/Edit/Bash > Task · 并行≤3 · 一次性Edit避免重复调用
**分工说明**：优化 SKILL.md 的信息密度和内容压缩时，可先使用 `optimize-docs` skill

## 核心约束

1. **SKILL.md ≤100 行**（skill 文件本身）· **辅助文档 ≤200 行** · **Description 一句话、中文、≤256 字符**
2. **Name**：动词+名词组合（如 `create-component`、`validate-schema`），使用精准词汇，避免模糊词（如 handle、process、manage）或抽象词（如 thing、stuff、item），小写+连字符，≤64 字符
3. **Description 格式**：`功能说明 + 使用时机（英文触发词）`，不含 (project) 或 (user) 等位置标注（Claude 调用时自动补全）
4. **内容原则**：仅写项目特定知识（约定/业务逻辑/自定义工具），不写通用知识
5. **利用上下文**：优先使用上下文已有信息，节省 tokens

## 工作流程

### 1. 确认需求

使用 `plan-implementation` skill 确认用户意图（创建/优化目标、范围、优先级）· 发现已满足需求时直接告知结论，避免过度询问

**关键词提示不明确时优先确认目标**：用户说"目录是 X"可能指 ①改name为X ②目录名与name不一致需修正，应先使用 AskUserQuestion 确认

### 2. 收集信息

Name: 动词+名词，精准词汇，小写+连字符 ≤64 字符 · 位置识别: 用户指定 skill 名时，先 Glob `~/.claude/skills/{name}/SKILL.md` 和 `.claude/skills/{name}/SKILL.md` 确定实际路径 · Description 草稿: 功能 + 时机（不含位置标注）

### 3. 选择结构

简单（推荐）: 单文件 `SKILL.md` · 复杂（必要时）: `SKILL.md` + 辅助文件（reference/examples/templates）

### 4. 编写内容

**结构模板**：

```
Frontmatter: name + description
何时使用：触发场景
效率优先：直接工具优于 subagent
核心功能/约束：项目逻辑
工作流程：
  1. 确认需求：使用 plan-implementation skill（如需求不明确）
  2. 自定义步骤...
  N. 返回信息：skill 执行完成或中断时输出简短信息（格式："✓ 功能完成" 或 "✗ 中断原因"）
示例：实际案例
```

**Description 写作规则**：

- 格式：`中文功能说明 + 使用时机（英文触发词）`· 一句话，不能用句号分隔 · 不含位置标注
- ✅ `重构 React 组件遵循项目规范，use when splitting large files or enforcing code style rules`
- ❌ `功能A。功能B`（句号分隔）· `重构组件，use when... (project)`（含位置标注）

### 5. 工具权限（可选）

`allowed-tools: Read, Grep, Glob` · 常见：只读 `Read Grep Glob` · 文档 `Read Glob Write` · 重构 `Read Grep Glob Edit`

### 6. 创建验证

**步骤≥3 时先用 TodoWrite 规划**（创建→验证→更新等多步任务）

1. **Write 前压缩**：采用符号分隔（·）· 列表化 · 合并同类项，估算行数 ≤80 行目标，减少超限概率
2. **Edit 文件**：分析所有修改点后一次性完成（**禁止分批 Edit**，避免多次工具调用开销）
3. Write/Edit 创建 · `wc -l <path>/SKILL.md` 检查（≤100）
4. 清单：[ ] Frontmatter 完整 [ ] name 符合规范 [ ] description 一句话 [ ] 仅项目知识 [ ] 含 plan-implementation（如适用）[ ] 含返回信息步骤 · **复用 Edit 返回的 cat -n 内容，禁止重复 Read**

### 7. 长度控制

**超 100 行**：① 用 `optimize-docs` skill 压缩 · ② 仍超限则拆分：详细 → reference.md（≤200 行）· 示例 → examples.md（≤200 行）
