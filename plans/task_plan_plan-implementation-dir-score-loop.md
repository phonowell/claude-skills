# task_plan_plan-implementation-dir-score-loop

## 目标
- 对 `skills/plan-implementation` 目录整体评分（`SKILL.md` + 附件）
- 循环执行“优化→复评”直到分数 >9.5

## 评分规则（总分 10）
- `SKILL.md` 质量（7.0）
- `examples.md` 一致性与可执行性（1.5）
- `reference.md` 约束映射与可复用性（1.5）

## 执行步骤
1. 基线评分与问题清单
2. 批量优化目录文件
3. 复评与差距分析
4. 重复 2-3 直至 >9.5

## 进度
- [x] Step 1 基线评分与问题清单
- [x] Step 2 批量优化目录文件
- [x] Step 3 复评与差距分析
- [x] Step 4 循环至达标

## 迭代记录
- 迭代 0（基线）：9.1/10
  - `SKILL.md`：9.5/10
  - `examples.md`：8.6/10
  - `reference.md`：8.8/10
  - 扣分：附件与主文命名约束不一致（`task_plan.md` 未 suffix 化）；示例含泛化场景；返回格式映射不完整
- 迭代 1（优化后）：9.8/10
  - `SKILL.md`：9.8/10
  - `examples.md`：9.7/10
  - `reference.md`：9.8/10
  - 提升：主文新增 I/O 契约与附件一致性约束；附件全部对齐 `task_plan_{suffix}.md`/`notes_{suffix}.md`；错误恢复与返回格式闭环
  - 结果：已超过 9.5，停止循环
