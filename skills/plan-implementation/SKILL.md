---
name: plan-implementation
description: 智能识别复杂任务并制定实现计划，use when receiving implementation requests or when user asks to "make a plan" or "制定计划" or mentions planning, organizing work, tracking progress
allowed-tools: Read, Grep, Glob, AskUserQuestion, Write, Edit
---

# 任务计划制定工作流

## 何时使用

**触发**：`制定计划`/`make a plan` · 多文件/架构决策 · `实现`/`开发`/`重构` 但缺技术细节 · 多步骤/研究/组织性工作
**不触发**：简单 bug（已指出位置）· 明确配置修改 · 纯查询 · 单文件编辑
**效率优先**：Read/Grep/Glob > Task · ≥3 步骤用持久化文件（非 TodoWrite）

## 工作流程

### 1. 智能判断

分析用户消息触发词/复杂度/明确性 → 需计划继续，否则直接执行

**简单度评估**：单文件单函数修改 + 明确需求 + 无架构决策 → 提示用户"任务较简单，建议直接执行（节省 ~10K tokens / $0.5）· 继续计划？"

**典型简单任务**：添加测试用例（已有代码结构）· 单文件格式化 · 明确配置修改 → 直接执行

**委托评估**：≥2 文件修改/批量操作/独立子任务/复杂推理 → 优先使用 `invoke-opencode-acp` skill 委托（节省主进程 tokens）

**激进策略**：Claude Code 环境默认委托复杂任务（~6s 开销可接受），仅单文件快速修改直接执行

### 2. 文件规划（≥3步任务）

**为何需要文件**：简单任务 TodoWrite 即可 · 复杂任务（≥3步/研究/多次工具调用）需持久化追踪目标，50+ 工具调用后避免遗忘原始目标

**3 文件模式**：

- `task_plan.md`：目标 · 阶段 · 决策 · 错误 · 状态（[模板](examples.md#task_plan-template)）
- `notes.md`：研究数据不塞上下文
- `[deliverable].md`：完成时创建

**文件路径约束**：必须创建在**项目/当前工作目录**，禁止创建在 skill 目录（~/.claude/skills/plan-implementation）

**核心循环**（≥3步骤任务强制执行）：

1. Write task_plan.md（初始化，项目目录）
2. **每轮开始前** Read task_plan.md（刷新注意力，避免偏离目标）
3. **每轮完成后** Edit task_plan.md（标记进度/记录错误/更新状态）
4. **禁止** 用 TodoWrite 替代 task_plan.md（复杂任务必须持久化）

**说明**：task_plan.md 替代 TodoWrite（CLAUDE.md "≥3步骤必建 TodoWrite" 在 skill 内不适用，文件持久化优先级更高）

**进阶原理**：[reference.md](reference.md)（Manus 注意力操控）· **实际案例**：[examples.md](examples.md)

### 3. 探索理解

Grep/Read 搜索代码 · <100行读全 · >200行分段 · **禁重复读**（批量修复时一次性 Read 全部待修复文件，缓存上下文） · **批量 Read → 批量 Edit 缓存上下文，减少重复读取** · 识别相似功能标注复用

### 4. 方向确认（架构决策时）

`AskUserQuestion` 列 2-3 方案 · **明确推荐选项** · 说明各选项优缺点（技术复杂度/维护成本/扩展性/实现时间） · **大量探索前**确认

### 5. 制定计划

**输出**：任务分解（3-8步，细化到文件/函数/行）· 文件清单 · 技术方案（API/状态/数据流）· 风险点（标"推测 XX，待确认"）
**验证**：递归/原地修改/状态依赖用伪代码模拟 · 检查逻辑/可行性/风险

### 6. 确认计划（强制）

`AskUserQuestion` 展示概要 · **明确推荐方案** · 标推测 · 选项附带简要说明（如有多方案） · **等确认**后执行

### 7. 执行实现

**执行前检查**（复杂任务）：Read task_plan.md 确认当前阶段/目标

**委托子任务**：若识别批量操作（≥5文件）/独立模块/并行任务 → 立即使用 `invoke-opencode-acp` skill 委托（节省主进程 tokens/加速执行）

严格按计划 · ~~简单任务 TodoWrite~~ **≥3步骤强制 task_plan.md**（TodoWrite 仅用于简单任务） · **批量操作模式**（批量 Read → 批量 Edit → 单次验证，减少重复读取）· Edit 无依赖批量调用 · 需调整立即中断 `AskUserQuestion` · 失败分析根因回退（同文件≥3次停止）

**重构类改动检查**（改函数签名/类型定义/参数语义时）：
- 明确标注测试依赖的契约点（哪些测试强依赖当前接口）
- 评估测试改动成本 vs 优化收益（测试需大改 → 保守优化）
- 优先保守优化（删冗余代码）> 激进重构（改接口设计）
- 破坏性修改失败时：立即回滚 · 提示用户手动重置，避免循环修复

**阶段完成**：Edit task_plan.md 标记进度 + 记录错误/决策

### 8. 返回信息

输出 `✓ 已完成` / `✓ 计划已确认` / `✓ 直接执行` / `✗ 中断：{原因}`
