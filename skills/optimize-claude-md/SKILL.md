---
name: optimize-claude-md
description: 优化 CLAUDE.md 遵循 100 行限制和渐进披露原则，use when updating/modifying/refactoring/optimizing CLAUDE.md
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# CLAUDE.md 优化器

## 何时使用
- 仅用于优化/重构 `CLAUDE.md`
- `SKILL.md` 优化路由至 `optimize-skill`
- 其他 markdown 路由至 `optimize-docs`

## 核心意图
保留可执行约束与关键命令，压缩到高密度、低歧义文本。

## 效率优先
Read/Edit/Bash > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. `CLAUDE.md` 必须 `wc -l <=100`
2. 仅保留项目特定规则；删除通用知识与解释性文字
3. 冲突时优先当前代码与仓库结构
4. 必保留段：关键约束/技术栈/核心命令/目录结构/工作流/Skill 使用/代码规范/输出格式
5. 必保留原则：Skill 调用后等待完成、最小心智负担、精简冗余、客观诚实、`try-catch` 高 ROI、`/plans/task_plan_{suffix}.md`
6. 若缺失 `AGENTS.md` 必须创建，且仅保留到 `CLAUDE.md` 的 `syslink`（`symlink`）与链接
7. 未通过验证直接中断

## 输入/输出契约
- 输入：`CLAUDE.md` 路径、必保留段、关键命令/路径
- 输出：优化后文件与 `wc -l`
- 成功：`✓ 已优化至 {行数} 行`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 确认范围：仅单文件 `CLAUDE.md`
2. 读取基线：Read + `wc -l`
3. 建保留清单：锁定必保留段与命令/路径
4. 去冗余：删除通用/重复/低 ROI 内容
5. 压缩表达：符号化压缩 `·/→`，保留可执行语义
6. 一次性 Edit：统一写回
7. 强制创建 `AGENTS.md`（若缺失）并写入 `symlink` 指向
8. 验证：`wc -l<=100`、段落齐全、命令/路径/链接有效
9. 返回信息：仅输出状态

## 检查清单
- [ ] 行数合规且无通用知识
- [ ] 必保留段与原则完整
- [ ] `AGENTS.md` 存在且链接正确
- [ ] 命令与路径可执行
- [ ] 返回信息符合约定
