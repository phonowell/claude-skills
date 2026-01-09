---
name: review-dialogue-quality
description: 监控对话 token 效率/工具使用/任务完成度并生成优化补丁，use when checking conversation quality or reviewing work progress
---

# 对话质量监控

## 何时使用

用户请求质量检查（"总结对话质量"/"检查 token 效率"）或任务结束后主动调用

**核心意图**：通过监控发现低效模式，优化 tokens 费用和执行时间

**前置要求**：Claude Code 中用户需先运行 `/cost` 获取统计数据；opencode 等其他环境无需此步骤（skill 无法直接调用 CLI 命令，需从上下文解析 cost 输出）
**效率优先**：完全依赖上下文，禁止使用 Read/Glob/Grep 等工具

## 核心约束

利用上下文 · 非侵入式 · Token 敏感监控 · 生成可落地补丁 · **惜字如金（简洁输出，用数据说话）**

## 检查维度

### 0. Skill 使用（如有）

触发时机 · 目标达成 · token 效率 · 替代方案

评分：✅ 准确+高效 · ⚠️ 时机/效率问题 · ❌ 误用/浪费

格式：`[Skill名] - 评分 | 触发/效果/建议`

### 1. Token 效率（最高优先级）

**数据来源**：`/cost` 命令输出

**指标**：总消耗 · 重复读取（≥2次）· Task 误用 · 超大文件（>200行）· 并行度

**费用**：优先用 `/cost` 实际值，无则估算（输出 5 倍于输入）

评分：✅ <1500 tokens · ⚠️ 1500-2000 · ❌ >2000

### 2. 工具规范

Bash(grep/find) vs Grep/Glob · Write vs Edit(修改) · 未并行独立任务 · 未 Read 先于 Edit/Write

评分：✅ 严格遵循 · ⚠️ 1-2 处偏差 · ❌ 频繁违反

### 3. 任务完成

TodoList 未更新（≥3 步骤任务未用 TodoWrite）· 遗漏功能 · 违反 CLAUDE.md · 未执行检查(tsc/lint)

评分：✅ 完整 · ⚠️ 主要完成或 TodoWrite 遗漏 · ❌ 明显遗漏

## 工作流程

1. **前置检查**：Claude Code 环境确认有 `/cost` 输出，否则提示运行；其他环境跳过
2. **收集分析**：解析 `/cost` · 工具调用 · 重复读取 · skill 使用
3. **评分输出**：三维度 ✅/⚠️/❌ · 简洁列表（数据+问题）
4. **补丁建议**：⚠️/❌ 时输出文本建议（不执行 Edit）
5. **返回信息**：输出 "✓ 检查完成" 或 "✗ 中断：{原因}"

## 补丁建议

根据上下文（工作目录/已读文件）判断归属：`~/.claude/skills/` → 个人 · `.claude/skills/` → 项目

**格式**：`文件: {path} · 位置: [章节] · 建议: 新增约束`

示例：`文件: ~/.claude/skills/foo/SKILL.md · 位置: [何时使用] · 建议: **效率优先**：禁止重复读取`

## 示例

```
Token: ❌ ~270K ($6.07) | input 230K + output 40.6K
工具: ✅ 25轮 3处并行
任务: ✅ 功能完整 tsc/lint通过
补丁: 文件: ~/.claude/skills/foo/SKILL.md · 位置: [何时使用] · 建议: 禁止重复读取
```
