# Claude Skills

Claude AI 技能管理与自动化工具链。

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm task <name>      # 执行任务
pnpm lint             # 代码检查与修复
```

## 核心命令

| 命令 | 说明 |
|------|------|
| `pnpm task <name>` | 执行 tasks/index.ts 中的指定任务 |
| `pnpm task push` | 同步任务到远程 |
| `pnpm task sync` | 同步 skills（双向 ~/.claude/skills） |
| `pnpm start` | 运行 src/index.ts |
| `pnpm lint` | 修复 src/**/*.{ts,tsx} 和 tasks/**/*.ts |

## 目录结构

```
├── skills/        # 技能定义（同步自 ~/.claude/skills）
├── tasks/         # 任务脚本
├── src/           # 源代码
└── task_plan.md   # 任务计划
```

## 技术栈

- **依赖**：fire-keeper · radash · ts-morph · tsx
- **开发**：ESLint · Stylintrc · TypeScript · Vitest
- **管理**：pnpm

## 可用技能

- `optimize-claude-md`：优化 CLAUDE.md
- `optimize-docs`：压缩通用文档
- `optimize-skill`：创建/重构 skill
- `use-fire-keeper`：文件操作/路径处理/并发任务
- `plan-implementation`：制定实现计划
- `review-code-changes`：代码质量审查
- `review-dialogue-quality`：对话效率检查

## 开发规范

详见 [CLAUDE.md](./CLAUDE.md)
