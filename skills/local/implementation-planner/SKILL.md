---
name: implementation-planner
description: Break down complex implementation work into an executable plan and keep `/plans/task_plan_{suffix}.md` and `/plans/notes_{suffix}.md` updated. Use this skill whenever the user asks to make a plan, 制定计划, break work into phases, organize a multi-step implementation, track progress, or when the task touches multiple files, has non-trivial uncertainty, or needs explicit research / implementation / TDD planning.
allowed-tools: Read, Grep, Glob, AskUserQuestion, Write, Edit
---

# 任务计划制定工作流

用可追踪计划降低返工，保障复杂任务可恢复、可验证。

## 触发边界
- 用户明确要求“制定计划/make a plan”
- 多文件改动、架构决策、信息缺口明显的实现任务
- 单文件明确修改或纯查询不触发

## 工作流程
1. 先判定是否真需要计划；不需要时直接执行并返回 `✓ 直接执行`
2. 需要计划时显式标记类型：`implementation` / `research` / `tdd`
3. 创建或读取 `/plans/task_plan_{suffix}.md`；复杂任务同步维护 `/plans/notes_{suffix}.md`
4. 用 `Read/Grep/Glob` 盘点范围、依赖、约束；步骤必须细化到文件或函数粒度
5. 做能力评估：优先复用已有 skill；存在生命周期缺口时记录 fallback
6. 写入 3-8 步计划，并为每阶段写清进入条件、退出条件、验证路径
7. 执行前先回读计划；每完成一阶段就立即回写 plan/notes
8. 有关键分歧或阻塞时再用 `AskUserQuestion`

## 资源入口
- 需要计划模板、阶段字段、状态写法时读 `reference.md`
- 需要少量高质量样例时读 `examples.md`
- 先读当前 plan 文件，再读附件；不要反过来

## 输出契约
- 输入：需求、影响范围、文件线索、是否允许分阶段交付
- 输出：计划路径、计划类型、3-8 步计划、能力评估结论、风险、当前状态
- 成功：`✓ 计划已确认` / `✓ 直接执行` / `✓ 已完成`
- 失败：`✗ 中断：{原因}`

## 约束
1. 不改写用户目标，不擅自新增计划外任务
2. `>=3` 步任务必须维护 `/plans/task_plan_{suffix}.md`
3. 复杂任务同步维护 `/plans/notes_{suffix}.md`
4. 决策前必须先读计划文件，阶段完成后必须回写
5. 不确定项写成“推测，待确认”

## 检查清单
- [ ] plan/notes 已创建或已更新
- [ ] 能力评估完整，缺口已调用 skill 或记录 fallback
- [ ] 计划类型、阶段退出条件、验证路径已补齐
- [ ] 返回信息符合输出契约
