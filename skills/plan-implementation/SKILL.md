---
name: plan-implementation
description: 智能识别复杂任务并制定实现计划，use when receiving implementation requests or when user asks to "make a plan" or "制定计划" or mentions planning, organizing work, tracking progress
allowed-tools: Read, Grep, Glob, AskUserQuestion, Write, Edit
---

# 任务计划制定工作流

## 何时使用

- 触发：`制定计划`/`make a plan`、多文件/架构决策、实现请求但缺技术细节、多步骤研究任务
- 不触发：单文件明确修改、纯查询、已定位的小修复

## 核心意图

通过结构化计划降低遗忘与返工，确保执行路径可追踪、可恢复。

## 核心约束

1. 不篡改用户原始需求，不擅自添加计划外目标
2. ≥3 步任务必须使用 `/plans/task_plan_{suffix}.md` 并持续更新
3. 复杂任务同步维护 `/plans/notes_{suffix}.md` 记录假设/决策/阻塞
4. 决策前必须 Read 计划文件；阶段完成后必须 Edit 回写状态
5. 输出计划需落到文件/函数粒度；风险项标注“推测，待确认”
6. 附件一致性：`examples.md` 与 `reference.md` 必须遵循 suffix 命名和返回格式约束

## 输入/输出契约

- 输入：需求描述、影响范围、现有文件线索、是否允许分阶段交付
- 输出：计划文件路径、3-8 步执行计划、关键决策与风险、当前状态
- 成功：`✓ 计划已确认` / `✓ 直接执行` / `✓ 已完成`
- 失败：`✗ 中断：{原因}`

## 效率优先

Read/Grep/Glob > Task · 并行≤3 · 一次性 Edit

## 工作流程

1. 判断是否需要计划：复杂任务进入计划；简单任务建议直接执行并确认
2. 初始化载体：创建 `/plans/task_plan_{suffix}.md`；复杂任务同步建 `/plans/notes_{suffix}.md`
3. 探索理解：Grep/Read 收集范围、文件、依赖；批量任务先全量读后集中改
4. 方向确认：存在架构分歧时用 `AskUserQuestion` 给 2-3 方案并等待确认
5. 制定计划：写入 3-8 步（文件/函数粒度）、方案、风险、验证路径
6. 执行前确认：Read 计划文件，确认当前阶段、阻塞和决策仍有效
7. 执行与回写：每轮执行后 Edit `task_plan_{suffix}.md`；重要上下文写入 `notes_{suffix}.md`
8. 返回：仅输出 `✓ 计划已确认` / `✓ 直接执行` / `✓ 已完成` / `✗ 中断：{原因}`

## 检查清单

- [ ] 复杂任务已使用 `task_plan_{suffix}.md`，且本轮已更新
- [ ] 关键假设/阻塞已写入 `notes_{suffix}.md`
- [ ] 计划步骤为 3-8 步且可执行到文件/函数粒度
- [ ] 风险项已标注“推测，待确认”
- [ ] 返回信息格式正确
