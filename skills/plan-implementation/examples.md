# Examples: plan-implementation 实战

## task_plan_{suffix}.md 模板

```markdown
# task_plan_{suffix}
## 目标
- [一句话目标]
## 执行步骤
1. [步骤]
2. [步骤]
3. [步骤]
## 进度
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
## 决策/风险
- [决策]: [理由]
- [推测，待确认]: [风险]
```

## 示例 1：多文件重构

- 请求：拆分 `src/service.ts` 并补测试
- 循环 1：Write `/plans/task_plan_service-split.md` + `/plans/notes_service-split.md`
- 循环 2：Read 计划 → Grep/Read 相关文件 → Edit 计划记录范围
- 循环 3：按计划改代码与测试 → Edit 计划更新进度/风险
- 返回：`✓ 已完成`

## 示例 2：登录问题修复

```markdown
# /plans/task_plan_login-token.md
## 进度
- [x] Step 1 复现问题
- [x] Step 2 定位到 src/auth/login.ts
- [ ] Step 3 修复并验证（当前）
## 决策/风险
- 决策：先补测试再改逻辑
- 推测，待确认：token 过期分支缺 await
```

## 错误恢复示例

- 错误：Read `config/auth.json` → not found
- 处理：Edit `task_plan_{suffix}.md` 写入错误记录 → Write 默认配置 → Read 复核
- 返回：若仍阻塞，`✗ 中断：缺少配置且无法确认默认值`

## 返回前自检

- Read `task_plan_{suffix}.md` 确认进度/风险已更新
- 复杂任务 Read `notes_{suffix}.md` 确认假设与阻塞已落盘
- 返回状态仅用 `✓ 已完成` / `✓ 计划已确认` / `✓ 直接执行` / `✗ 中断：{原因}`
