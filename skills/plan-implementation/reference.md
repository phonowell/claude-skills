# Reference: plan-implementation 执行基线

## 核心原则

1. 外部化记忆：计划与研究信息落盘，不依赖会话记忆
2. 决策前复查：每轮关键决策前 Read `task_plan_{suffix}.md`
3. 失败可追踪：错误与处理必须写入计划或笔记，禁止静默重试
4. 命名唯一：同一任务使用唯一 `{suffix}`，避免计划文件冲突
5. 一致返回：仅使用 `✓`/`✗` 状态格式

## 文件分工

- `/plans/task_plan_{suffix}.md`：目标、步骤、进度、决策、风险、错误
- `/plans/notes_{suffix}.md`：调研数据、假设、未决问题
- `[deliverable].md`：最终交付内容（可选）

## 最小更新循环

1. Read `task_plan_{suffix}.md`
2. 执行当前步骤
3. Edit `task_plan_{suffix}.md` 更新进度/错误/决策
4. 复杂任务同步 Edit `notes_{suffix}.md`
5. 进入下一轮

## 风险记录格式

```markdown
## 决策/风险
- 决策：先补测试再改逻辑（降低回归风险）
- 推测，待确认：缓存层 TTL 由环境变量覆盖
- 错误：config 缺失 → 已生成默认值并复核
```

## 反模式

- 只改代码不回写计划
- 多任务复用同一个 `task_plan.md`
- 返回前未复查计划状态
- 发现阻塞后继续推进不暴露风险

## 返回前检查

- [ ] `task_plan_{suffix}.md` 已更新到当前轮次
- [ ] `notes_{suffix}.md` 已写关键假设/阻塞
- [ ] 返回状态符合 `✓ 已完成` / `✓ 计划已确认` / `✓ 直接执行` / `✗ 中断：{原因}`
