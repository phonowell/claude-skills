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
| `pnpm task upstream-skills` | 按 `skills/external/<owner>/<name>` 执行目录驱动更新；缺失时回退 `skills.sh/<owner>/skills/<name>` |
| `pnpm start` | 导入全局实体 skill 到仓库、回链全局软链、更新 external 上游 |
| `pnpm lint` | 修复 src/**/*.{ts,tsx} 和 tasks/**/*.ts |

## 目录结构

```
├── skills/
│   ├── external/  # 全局回收或上游/第三方 skill；以 skills.sh 路径 `owner/repo[/skill]` 存放
│   └── local/     # 仅仓库内手动新建的本地 skill
├── tasks/         # 任务脚本
├── src/           # 源代码
└── task_plan.md   # 任务计划
```

## `pnpm start` 行为

1. 扫描受管全局 skill 根目录
2. 全局导入默认进入 `skills/external`；仅仓库中已存在的 `skills/local/*` 保持 local，`.system` 回签强制 external
3. 用软链把仓库内 skill 回链到全局目录
4. 对 `skills/external/<owner>/<name>` 先尝试 `skills.sh/<owner>/<name>`，404 时再回退 `skills.sh/<owner>/skills/<name>` 并执行更新
5. GitHub 直连失败时，自动探测本机 Clash/Mihomo 代理配置并带代理重试 clone

## 当前 external 归属

- `skills/external/vercel-labs/agent-browser`
- `skills/external/anthropics/claude-plugins-official/claude-md-improver`
- `skills/external/anthropics/skill-creator`
- `skills/external/dimillian/github`
- `skills/external/openai/openai-docs`
- `skills/external/openai/skill-installer`

## 技术栈

- **依赖**：fire-keeper · radash · ts-morph · tsx
- **开发**：ESLint · Stylintrc · TypeScript · Vitest
- **管理**：pnpm

## 可用技能

- `agent-browser`：浏览器自动化
- `claude-md-improver`：审查并改进 `CLAUDE.md`
- `github`：GitHub CLI 工作流
- `skill-creator`：创建/更新/评测 skill
- `fire-keeper-guide`：文件操作/路径处理/并发任务
- `implementation-planner`：制定实现计划
- `code-reviewer`：代码质量审查
- `search-skills-sh`：skills.sh 技能检索
- `tapd-story-archiver`：归档 TAPD story 正文并生成 meta

## 开发规范

详见 [CLAUDE.md](./CLAUDE.md)
