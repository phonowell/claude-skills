# 项目规范

## 关键约束

- 禁通用知识 · 零解释性文字 · 行数 ≤100
- Skill 优先：调用后**必须等待完成**再执行其他操作
- 精简冗余 · 冲突信代码
- 客观诚实：不主观评价 · 不因用户情绪转移立场 · 不编造事实 · 立刻暴露不确定信息
- 计划：≥3 步任务用 `/plans/task_plan_{suffix}.md` 持续更新
- 输出：禁预告文字 · 状态用符号 ✓/✗/→ · 一次性批量 Edit · 数据优先 · 直达结论 · 工具间隔零输出 · 代码块零注释 · ≥2 条用列表 · 禁总结性重复 · 进度 {当前}/{总数}
- Worktree：强制 git worktree · 禁 switch/checkout · 合并需 squash 单 commit · 合并后清理

## 技术栈

**依赖**：fire-keeper · radash · ts-morph · tsx
**开发**：ESLint · Stylintrc · TypeScript · Vitest
**管理**：pnpm
**模型**：子任务可用 haiku（Task 工具）

## 核心命令

```bash
pnpm lint         # 修复 src/**/*.{ts,tsx} tasks/**/*.ts
pnpm task <name>  # 执行 tasks/index.ts
pnpm task push    # 同步任务
pnpm task sync    # 同步 skills（双向 ~/.claude/skills）
pnpm task upstream-skills # 同步 skills.sh 上游 skill
```

## 目录结构

```
. 项目根
├── plans/        # 任务计划
├── skills/       # 技能定义（同步自 ~/.claude/skills）
├── tasks/        # 任务脚本
├── src/          # 源代码
└── task_plan.md  # 任务计划（根目录）
```

## 工作流

1. 新任务 → `/plans/task_plan_{suffix}.md` → 用例 → 实现
2. fire-keeper API（详见 fire-keeper-guide skill）：glob · copy · isSame · promptAction
3. 测试 → `pnpm lint` → 提交

## Skill 使用

- agent-browser：浏览器自动化
- claude-md-improver：审查并改进 `CLAUDE.md`
- github：GitHub CLI 工作流
- skill-creator：创建/更新/评测 skill
- fire-keeper-guide：文件操作/路径处理/并发任务
- implementation-planner：制定实现计划
- code-reviewer：代码质量审查
- search-skills-sh：skills.sh 技能检索
- tapd-story-archiver：归档 TAPD story 原始正文并生成 meta

## 代码规范

- TypeScript 严格模式 · 类型自然流动（🚫 断言）
- 🚫 eslint-disable 批量压制 · ≥5 处非空断言立即重构类型架构

## 输出格式

- 错误：✗ {位置}:{类型}
- 路径：. 项目根 · ~ 主目录
- 提问直入
