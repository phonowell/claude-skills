---
name: plan-implementation
description: 智能识别复杂任务并制定实现计划，use when receiving implementation requests or when user asks to "make a plan" or "制定计划" or mentions planning, organizing work, tracking progress
allowed-tools: Read, Grep, Glob, AskUserQuestion, Write, Edit
---

# 任务计划制定工作流

## 何时使用
- 用户明确要求“制定计划/make a plan”
- 多文件改动、架构决策、信息缺口明显的实现任务
- 单文件明确修改或纯查询不触发

## 核心意图
用可追踪计划降低返工，保障复杂任务可恢复、可验证。

## 效率优先
Read/Grep/Glob > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. 不改写用户目标，不擅自新增计划外任务
2. `>=3` 步任务必须维护 `/plans/task_plan_{suffix}.md`
3. 复杂任务同步维护 `/plans/notes_{suffix}.md`
4. 执行前必须做能力评估：现有 skill 是否覆盖
5. 计划类型必须显式标记：`implementation` / `research` / `tdd`
6. skill 生命周期缺口优先调用专用 skill；若缺失，必须在 notes 标注 fallback
7. 决策前必须 Read 计划文件；阶段完成后必须 Edit 回写
8. 步骤细化到文件/函数粒度；不确定项标注“推测，待确认”
9. 每阶段必须有进入条件、退出条件、验证路径

## 输入/输出契约
- 输入：需求、影响范围、文件线索、是否允许分阶段交付
- 输出：计划路径、计划类型、3-8 步计划、能力评估结论、风险与当前状态
- 成功：`✓ 计划已确认` / `✓ 直接执行` / `✓ 已完成`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 判断复杂度：决定直接执行或进入计划
2. 选计划类型：`implementation` / `research` / `tdd`
3. 初始化文件：创建 `task_plan_{suffix}.md`，复杂任务加 `notes_{suffix}.md`
4. 探索范围：Read/Grep 获取文件、依赖、约束
5. 能力评估：优先复用现有 skill；生命周期缺口缺专用 skill 时记录 fallback
6. 方向确认：存在分歧时使用 `AskUserQuestion`
7. 写入计划：3-8 步 + 风险 + 每阶段进入/退出条件 + 验证路径
8. 执行前复核：Read 当前计划状态与阻塞
9. 执行回写：每轮更新 plan/notes
10. 返回信息：输出状态

## 检查清单
- [ ] `task_plan_{suffix}.md` 已创建并更新
- [ ] 复杂任务已维护 `notes_{suffix}.md`
- [ ] 能力评估完整；生命周期缺口已调用或已记录 fallback
- [ ] 已标注计划类型与阶段退出条件
- [ ] 步骤可执行到文件/函数粒度
- [ ] 返回信息符合约定
