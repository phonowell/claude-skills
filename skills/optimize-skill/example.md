---
name: optimize-skill-example
description: skill 优化示例，use when refactoring SKILL.md with consistent triggers and constraints
---

# optimize-skill 示例

## 何时使用
- 演示如何将低质量 `SKILL.md` 重构为可执行版本
- 需要对齐触发语义、约束、返回格式与附件一致性

## 效率优先
- Read/Glob/Write/Edit/Bash > Task · 并行≤3 · 一次性 Edit

## 输入示例

```
文件：skills/release-note/SKILL.md
现状：129 行；description 缺英文触发词；工作流缺返回步骤
附件：example.md 与主文触发语义不一致
```

## 工作流程
1. `wc -l` 建基线，标记超限段与低 ROI 段
2. 修正 frontmatter：`name` 规则、description 中英触发词同一行
3. 补齐结构：何时使用/核心意图/效率优先/约束/I-O/流程/返回信息
4. 同步附件：example 与主文触发语义、返回格式一致
5. `wc -l` 复核主文 ≤100、附件 ≤200

## 输出示例
- ✓ skill 优化完成
- ✓ `SKILL.md`：129 → 93 行
- ✓ `example.md`：触发语义与返回格式已对齐
- ✗ 原因：若触发语义冲突且无法确认
