---
name: optimize-docs
description: 优化通用 markdown 文档，遵循行限制和渐进披露原则，use when creating/updating/refactoring/optimizing markdown docs
allowed-tools: Read, Glob, Edit, Bash
---

# 通用文档优化器

## 何时使用

优化/重构/创建通用 .md 文档（非 SKILL.md 和 CLAUDE.md）

**路由规则**：

- **SKILL.md** → 使用 `optimize-skill` skill
- **CLAUDE.md** → 使用 `optimize-claude-md` skill
- **其他 .md** → 使用本 skill

**效率优先**：直接使用 Read/Glob/Edit/Bash 工具，避免调用 Task 工具

## 启动说明

**本 skill 由主 Claude 调用时的正确流程**：

1. 主 Claude 调用 `Skill(optimize-docs)`
2. **主 Claude 必须等待本 skill 完成**（不得立即自行优化）
3. 本 skill 完成后，主 Claude 总结结果给用户

## 核心约束

1. **≤200 行硬限制** · `wc -l` 验证
2. **渐进披露**：高频信息前置 → 详细内容后置
3. **零通用知识**：不写编程常识/框架基础/语法规则
4. **低 ROI 过滤**：移除过度解释/重复内容/显而易见信息
5. **利用上下文**：复用已知信息，节省 tokens
6. **合理压缩**：避免过度压缩导致信息丢失，确保关键内容完整性

## 优化技术

### 保留内容

项目特定规则 · 非显而易见细节 · 关键配置 · 代码示例（带行号） · 检查清单

### 移除内容

通用知识 · 过度解释 · 重复内容 · 冗长背景 · 显而易见信息

### 压缩技巧

**批量压缩策略**：超大文档（>500→<300行）先规划压缩点（通用知识/冗余示例/格式），再合并 Edit（减少迭代次数），避免逐段优化导致 token 膨胀

**合并同类**：`## 命名规范\n组件使用大驼峰。\n## 扩展名\n必须 .tsx` → `组件用大驼峰 + .tsx`

**列表替代段落**：多个独立陈述用 `-`，不用完整句子

**代码引用**：`ID 在 package.json 第 2 行` → `[package.json:2](package.json#L2)`

**符号分隔**：1 行多原则用 `·` 分隔

## 工作流程

1. **确认需求**：使用 `plan-implementation` skill 确认用户意图（优化目标、范围、优先级）

2. **路由检查**：
   - 文件名 = `SKILL.md` → 终止并提示使用 `create-skill` skill
   - 文件名 = `CLAUDE.md` → 终止并提示使用 `optimize-claude-md` skill
   - 其他 .md → 继续

3. **分析**：`wc -l file.md` 检查行数 · Read 评估超限/通用知识/低 ROI

4. **优化**：
   - 优先级：通用知识 > 过度解释 > 冗余 > 示例压缩 > 格式
   - 使用 Edit 工具修改（不调用 Task）

5. **验证**：`wc -l file.md` · 检查通用知识/低 ROI/关键信息完整

6. **返回信息**：输出 "✓ 已优化至 {行数} 行" 或 "✓ 路由至 {skill}" 或 "✗ 中断：{原因}"

## 标准结构

Frontmatter → 标题 → 何时使用 → 效率优先 → 核心原则/约束 → 工作流程 → 详细内容（示例/命令）

## 成功标准

- [ ] ≤200 行（`wc -l` 验证）
- [ ] 无通用知识
- [ ] 信息密度高
- [ ] 关键信息完整
- [ ] 代码引用准确
