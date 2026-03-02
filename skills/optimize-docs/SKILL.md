---
name: optimize-docs
description: 优化通用 markdown 文档，遵循行限制和渐进披露原则，use when creating/updating/refactoring/optimizing markdown docs
allowed-tools: Read, Glob, Edit, Bash
---

# 通用文档优化器

## 何时使用
- 优化/重构/创建通用 `.md`
- `SKILL.md` 路由至 `optimize-skill`
- `CLAUDE.md` 路由至 `optimize-claude-md`

## 核心意图
保持命令/路径/链接可执行前提下压缩文本并降低维护成本。

## 效率优先
Read/Glob/Edit/Bash > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. 目标 `wc -l <=200`
2. 禁通用知识、解释性废话、重复段落
3. 渐进披露：高频规则前置、细节后置
4. 冲突时信代码与当前仓库结构
5. 命令/路径/链接/返回格式必须保真
6. 超限先压缩，仍超再拆分 references/examples
7. 验证不通过即中断

## 输入/输出契约
- 输入：目标路径、保留段、关键命令/链接、是否允许拆分
- 输出：优化后文档 + `wc -l` + 状态
- 成功：`✓ 已优化至 {行数} 行`
- 路由：`✓ 路由至 {skill}`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 确认范围：单文件且目标明确
2. 路由检查：命中 `SKILL.md`/`CLAUDE.md` 立即路由
3. 基线分析：Read + `wc -l`，标记低 ROI 内容
4. 建保留清单：命令/路径/链接/返回格式
5. 一次性 Edit：按优先级压缩并保持结构
6. 验证：行数、链接、示例、路由结果
7. 返回信息：仅输出状态

## 检查清单
- [ ] 行数合规（<=200）
- [ ] 无通用知识与重复表达
- [ ] 关键信息完整且可执行
- [ ] 路由判断正确
- [ ] 返回信息符合约定
