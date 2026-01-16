---
name: plan-implementation
description: 智能识别复杂任务并制定实现计划，use when receiving implementation requests or when user asks to "make a plan" or "制定计划" or mentions planning, organizing work, tracking progress
allowed-tools: Read, Grep, Glob, AskUserQuestion, Write, Edit
---

# 任务计划制定工作流

## 何时使用

**触发**：`制定计划`/`make a plan` · 多文件/架构决策 · `实现`/`开发`/`重构` 但缺技术细节 · 多步骤/研究/组织性工作
**不触发**：简单 bug（已指出位置）· 明确配置修改 · 纯查询 · 单文件编辑

**核心意图**：通过结构化计划避免复杂任务中遗忘目标、偏离方向、重复劳动

**核心约束**：禁止篡改原始需求 · 禁止擅自添加计划外内容 · 深度思索后制定 · 细化到文件:行号粒度

**效率优先**：Read/Grep/Glob > Task · ≥3 步骤用 task_plan.md（替代 TodoWrite，持久化优先）

## 工作流程

### 1. 判断是否需要计划
- 复杂触发：制定计划/make a plan，多文件/架构决策，缺技术细节，多步骤/研究型 → 进入计划
- 简单触发：单文件+明确需求+无决策 → 提示“建议直接执行（节省 ~10K tokens）· 继续计划？”再按用户意愿
- 委托评估：≥2 文件或批量/并行子任务 → 优先 `invoke-opencode-acp`，单文件小改可跳过

### 2. 计划载体（≥3 步任务）
- 3 文件模式：`/plans/task_plan.md`（目标/阶段/决策/错误/状态）；`/plans/notes.md`（研究数据）；`[deliverable].md`（交付物）
- 路径约束：文件放 `/plans`，禁止放 skill 目录
- 核心循环（≥3 步强制）：初始化 task_plan.md → 每轮前 Read → 每轮后 Edit 记录进度/错误/决策 → 禁用 TodoWrite 替代（<3 步可用 TodoWrite）
- 注意力钩子：未更新 task_plan.md 不得进入下一轮；对话中形成的假设/决策/阻塞，随手写入 notes.md（避免遗忘）
- 进阶参考：reference.md（注意力）、examples.md（案例）

### 3. 探索理解
- Grep/Read 搜索；<100 行读全，>200 行分段；批量修复：一次 Read 全部待改文件并缓存
- 批量模式：批量 Read → 批量 Edit → 单次验证；识别相似功能可复用

### 4. 方向确认（架构决策/大改前）
- `AskUserQuestion` 列 2-3 方案，首项推荐并标注优缺点；确认后再深入

### 5. 制定计划
- 输出：3-8 步任务分解（到文件/函数/行）· 文件清单 · 技术方案（API/状态/数据流）· 风险点（标“推测，待确认”）
- 验证：递归/原地修改/状态依赖用伪代码模拟；检查可行性与风险

### 6. 确认计划（执行前）
- 用 `AskUserQuestion` 展示概要和优缺点，首项推荐；等确认后执行

### 7. 执行实现
- 执行前：Read task_plan.md 刷新目标/阶段
- 委托：批量（≥5 文件）/独立模块/可并行 → 立即 `invoke-opencode-acp`
- 按计划执行；需调整时先中断并确认；失败同文件≥3 次停止分析
- 重构检查：改签名/类型/参数时标注契约点，保守优先
- 阶段完成：Edit task_plan.md 记录进度/错误/决策，补充 notes.md 中的对话要点/假设/风险

### 8. 返回信息
- 输出 `✓ 已完成` / `✓ 计划已确认` / `✓ 直接执行` / `✗ 中断：{原因}`
- 返回前自检：task_plan.md 已更新最新进度/错误/决策，notes.md 已写关键对话/假设/风险
