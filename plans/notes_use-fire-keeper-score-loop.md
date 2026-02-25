# notes_use-fire-keeper-score-loop

- 用户要求：先打分，再循环优化评分，直到 > 9.5
- 采用策略：以真实代码为准校正事实，再压缩结构提高可执行性
- 事实核对依据：`/Users/mimiko/Projects/fire-keeper/src/*.ts` 与 `package.json`
- 关键修正：
  - `watch` 从“v4”修正为 `chokidar@^5`
  - `isExist` 从“含 * 返回 false”修正为“含 * 抛错”
  - 增加触发反例与需求映射，降低误触发与选型歧义
