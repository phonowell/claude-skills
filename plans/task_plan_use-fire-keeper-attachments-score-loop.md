# task_plan_use-fire-keeper-attachments-score-loop

## 目标
- 对 `skills/use-fire-keeper/reference.md` 与 `skills/use-fire-keeper/examples.md` 分别执行评分与优化循环
- 两个附件最终评分均 > 9.5

## 步骤与状态
- [completed] 1. 建立附件评分基线
- [completed] 2. 优化 reference.md 并复评到 > 9.5
- [completed] 3. 优化 examples.md 并复评到 > 9.5

## 评分维度
- 准确性(4): 与 fire-keeper 实现一致
- 可执行性(2): 能直接指导选型/落地
- 结构与检索性(2): 高频信息前置、定位快
- 低 ROI 控制(1): 去除重复与空洞说明
- 合规性(1): 行数 <= 200

## 评分记录
- reference.md：8.9/10 -> 9.7/10（第 1 轮达标）
- examples.md：8.8/10 -> 9.6/10（第 1 轮达标）

## 验证
- `wc -l skills/use-fire-keeper/reference.md` = 74（<= 200）
- `wc -l skills/use-fire-keeper/examples.md` = 125（<= 200）
