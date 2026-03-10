---
name: optimize-claude-md
description: 优化 CLAUDE.md 遵循 100 行限制和渐进披露原则，use when updating/modifying/refactoring/optimizing CLAUDE.md
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# CLAUDE.md 优化器

## 何时使用
- 仅用于优化/重构 `CLAUDE.md`
- `SKILL.md` 优化路由至 `optimize-skill`
- 其他 markdown 不在本 skill 范围

## 核心意图
保留可执行约束与关键命令，并用渐进披露压缩到高密度、低歧义文本。

## 效率优先
Read/Edit/Bash > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. `CLAUDE.md` 必须 `wc -l <=100`
2. 仅保留项目特定规则；删除通用知识与解释性文字
3. 冲突时优先当前代码与仓库结构
4. 必保留段：关键约束/技术栈/核心命令/目录结构/工作流/Skill 使用/代码规范/输出格式
5. 必保留原则：Skill 调用后等待完成、最小心智负担、精简冗余、客观诚实、`try-catch` 高 ROI、`/plans/task_plan_{suffix}.md`
6. 若缺失 `AGENTS.md` 必须创建，且仅保留到 `CLAUDE.md` 的 `syslink`（`symlink`）与链接
7. 必须显式检查渐进披露层级：核心约束 > 高频命令 > 补充细节
8. 输出必须包含压缩前后 `wc -l`；能估算时补充 token 变化
9. 未通过验证直接中断

## 输入/输出契约
- 输入：`CLAUDE.md` 路径、必保留段、关键命令/路径
- 输出：优化后文件 + `wc -l` 前后对比 + 状态
- 成功：`✓ 已优化至 {行数} 行`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 确认范围：仅单文件 `CLAUDE.md`
2. 读取基线：Read + `wc -l`
3. 建保留清单：锁定必保留段、命令/路径、不可丢规则
4. 分层：标记核心约束/高频命令/补充细节
5. 去冗余：删除通用/重复/低 ROI 内容
6. 压缩表达：符号化压缩 `·/→`，保留可执行语义
7. 记录变化：统计 `wc -l` 前后；能估算时补 token 变化
8. 一次性 Edit：统一写回
9. 强制创建 `AGENTS.md`（若缺失）并写入 `symlink` 指向
10. 验证：`wc -l<=100`、段落齐全、命令/路径/链接有效、层级顺序正确
11. 返回信息：仅输出状态

## 检查清单
- [ ] 行数合规且无通用知识
- [ ] 必保留段与原则完整
- [ ] `AGENTS.md` 存在且链接正确
- [ ] 已检查渐进披露层级与前后对比
- [ ] 命令与路径可执行
- [ ] 返回信息符合约定
