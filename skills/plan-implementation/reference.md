# Reference: Manus Context Engineering Principles

基于 Manus（Meta 2025/12 以 $2B 收购）的上下文工程原则

## Manus 6 原则

### 1. 文件系统作为外部存储

**问题**：上下文窗口有限 · 塞满内容降低性能增加成本
**方案**：文件系统=无限存储 · 存大量内容于文件 · 上下文仅保留路径 · 需要时查找 · 压缩必须可逆

### 2. 重复读取操控注意力

**问题**：50+ 工具调用后遗忘原始目标（"lost in the middle"）
**方案**：task_plan.md 反复 RE-READ
```
上下文起始：[原始目标 - 远距离，已遗忘]
...大量工具调用...
上下文末尾：[刚读取的 task_plan.md - 获得注意力！]
```
决策前读取计划文件 → 目标出现在注意力窗口

### 3. 保留失败痕迹

> "错误恢复是真正智能体行为的最清晰信号"

**问题**：本能隐藏错误静默重试 · 浪费 token 失去学习
**方案**：计划文件保留失败行为
```markdown
## Errors Encountered
- FileNotFoundError: config.json → 创建默认配置
- API timeout → 指数退避重试成功
```
模型看到失败更新内部理解

### 4. 避免 Few-Shot 过拟合

**问题**：重复 action-observation 模式导致漂移和幻觉
**方案**：引入可控变化 · 变换措辞 · 避免盲目复制模式 · 重复任务时重新校准

### 5. 稳定前缀优化缓存

**问题**：Agent 输入重（100:1 比）· 每 token 成本高
**方案**：静态内容置前 · 仅追加上下文（禁修改历史）· 一致序列化

### 6. 仅追加上下文

**问题**：修改先前消息使 KV-cache 失效
**方案**：禁修改先前消息 · 始终追加新信息

## Agent 循环

Manus 持续循环：分析 → 思考 → 选工具 → 执行 → 观察 → 迭代 → 交付

**文件操作时机**：`write` 新文件/完全重写 · `append` 增量添加 · `edit` 更新特定部分（checkbox/status）· `read` 决策前复查

## 统计数据

- 平均 50 工具调用/任务 · 输入输出比 100:1 · Meta 收购价 $2B · 8个月达 $100M 营收

## 关键引用

> "模型进步是涨潮，我们要做船，不是困在海底的桩"
> "复杂任务时我将笔记/代码/发现存文件，工作时引用"
> "用 edit 更新计划 checkbox，而非重写整个文件"

**来源**：https://manus.im/de/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
