# task_plan_use-fire-keeper-score-loop

## 目标
- 对 `skills/use-fire-keeper/SKILL.md` 进行十分制评分
- 循环执行“优化→复评”，直到得分 > 9.5

## 步骤与状态
- [completed] 1. 建立评分标准并完成基线评分
- [completed] 2. 基于实现事实优化 SKILL.md
- [completed] 3. 复评与迭代，直到分数 > 9.5

## 评分维度
- 准确性(4): 与 fire-keeper 真实实现一致
- 可执行性(2): 流程可直接执行
- 触发边界(1.5): 何时用/不用清晰
- 结构与压缩(1.5): 信息密度高且可读
- 合规性(1): 行数/frontmatter/返回信息

## 评分记录
- 基线 v0：8.6/10（`watch` 版本信息过时；`isExist` 语义不准；触发反例不够直观）
- 迭代 v1：9.3/10（修正实现事实与流程可执行性，但需求映射仍偏隐式）
- 迭代 v2：9.7/10（补充触发反例+需求映射+流程收敛，达到目标）

## 验证
- `wc -l skills/use-fire-keeper/SKILL.md` = 68（<= 100）
