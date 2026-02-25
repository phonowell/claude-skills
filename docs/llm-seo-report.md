# GitHub LLM SEO 审计报告

## 摘要
- EN: Toolchain to manage and sync LLM skill definitions across Claude/Codex/Cursor directories, with a task runner for maintenance.
- ZH: 面向多代理环境的 LLM skill 管理/同步工具链，提供任务脚本与自动化维护能力。

## 仓库信息
- 路径: /Users/mimiko/Projects/claude-skills
- 远程: https://github.com/phonowell/claude-skills
- 元数据: description 为空; topics 为空; homepage 为空

## 审计依据
- README.md
- docs/design.md
- package.json
- src/index.ts
- tasks/index.ts
- GitHub 元数据 (gh repo view)

## 问题清单 (按优先级)
1. [High] GitHub 元数据为空 (description/topics/homepage)，LLM 与搜索系统难以判断定位与领域。
2. [High] README 缺少清晰定位/关键词/核心能力与示例，需读源码才能理解主功能。
3. [Medium] README 命令说明与实际脚本有歧义（文档写 `pnpm task sync`，仓库无 `tasks/sync.ts`，实际可用 `pnpm sync`/`pnpm start`）。
4. [Medium] README “可用技能”列表缺失 `agent-browser`、`optimize-github-llm-seo`、`search-github`、`init-worktree` 等，能力画像不完整。
5. [Medium] 缺少 `llms.txt`/`llms.md`/README LLM 友好区块，LLM 可索引性弱。
6. [Low] `docs/design.md` 与示例未在 README 索引；无 `LICENSE`/`CITATION`/`SECURITY`，降低复用信心。

## 改进建议
- 设置 GitHub description/topics/homepage (impact: high)
- 在 `README.md` 增加 LLM 友好摘要、关键能力、示例与关键词 (impact: high)
- 添加 `llms.txt` 与 `llms.md` (impact: medium)
- 校正 README 命令并补全技能清单 (impact: medium)
- 链接 `docs/design.md` 与示例，补齐 license/citation (impact: low)

## 待确认修改
- `README.md`: 添加 LLM 友好摘要区块、校正命令说明、补全技能清单、加入 `docs/design.md` 与示例链接
- `llms.txt`: 新增
- `llms.md`: 新增
- GitHub 元数据: description/homepage/topics
- `LICENSE`、`CITATION.cff`、`SECURITY.md`: 可选新增

## 备注
- 目标受众按仓库内容推断为“多代理环境的技能库维护者/开发者”
