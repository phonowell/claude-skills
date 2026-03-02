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
5. 若缺口属于 skill 生命周期（搜索/新增/替换/移除），必须调用 `audit-skill-lifecycle` 并等待完成
6. 决策前必须 Read 计划文件；阶段完成后必须 Edit 回写
7. 步骤细化到文件/函数粒度；不确定项标注“推测，待确认”

## 输入/输出契约
- 输入：需求、影响范围、文件线索、是否允许分阶段交付
- 输出：计划路径、3-8 步计划、能力评估结论、风险与当前状态
- 成功：`✓ 计划已确认` / `✓ 直接执行` / `✓ 已完成`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 判断复杂度：决定直接执行或进入计划
2. 初始化文件：创建 `task_plan_{suffix}.md`，复杂任务加 `notes_{suffix}.md`
3. 探索范围：Read/Grep 获取文件、依赖、约束
4. 能力评估：先判断缺口类型；仅生命周期缺口调用 `audit-skill-lifecycle`
5. 方向确认：存在分歧时使用 `AskUserQuestion`
6. 写入计划：3-8 步 + 风险 + 验证路径
7. 执行前复核：Read 当前计划状态与阻塞
8. 执行回写：每轮更新 plan/notes
9. 返回信息：输出状态

## 检查清单
- [ ] `task_plan_{suffix}.md` 已创建并更新
- [ ] 复杂任务已维护 `notes_{suffix}.md`
- [ ] 能力评估完整；生命周期缺口已调用并等待
- [ ] 步骤可执行到文件/函数粒度
- [ ] 返回信息符合约定
