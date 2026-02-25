# notes_use-fire-keeper-attachments-score-loop

- 用户要求：reference.md 与 examples.md 也执行评分与优化循环
- 方法：先基于实现做准确性核对，再做结构压缩与示例可执行性增强
- 基线评分：
  - reference.md：8.9/10（`isExist` 含 `*` 的行为描述不准；`run` 返回类型表述不准；高频决策入口不够靠前）
  - examples.md：8.8/10（偏 API 展示，缺“触发/未触发”与“返回信息”示例）
- 第 1 轮优化：
  - reference.md：重排为“高频映射 -> 关键规则 -> 分类 API -> 原生替代速查”，并修正 `isExist/watch/run` 语义
  - examples.md：新增“触发/未触发”输出骨架与最小可执行场景模板
- 复评结果：
  - reference.md：9.7/10
  - examples.md：9.6/10
