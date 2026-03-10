# 项目 Skill 价值评审

## 方法
- 时间：2026-03-10
- 数据源：`skills/*/SKILL.md`、`docs/skills-sh-analog-optimization-audit.md`、`npx skills find`、Top 候选 `npx skills add <id> --list`
- 维度：
- `市场替代度`：skills.sh 上同类 skill 越多、安装量越高，分越低（1-3）
- `本地专属性`：越依赖本仓规则/依赖/工作流，分越高（1-4）
- `可执行资产`：脚本/模板/引用资料越完整，分越高（1-3）
- `总分 = 市场替代度 + 本地专属性 + 可执行资产`
- 判定：`8-10=高` · `5-7=中` · `0-4=低`

## 总表
| skill | skills.sh 对标 | 市场替代度 | 本地专属性 | 可执行资产 | 总分 | 价值 |
|---|---:|---:|---:|---:|---:|---|
| `tapd-fetch-and-archive` | 弱相关候选，缺直接同构 | 3 | 4 | 3 | 10 | 高 |
| `use-fire-keeper` | 仅文件系统近邻，无 fire-keeper 同构 | 3 | 4 | 2 | 9 | 高 |
| `agent-browser` | 浏览器自动化高度拥挤，Top 候选 204 installs | 1 | 2 | 3 | 6 | 中 |
| `optimize-claude-md` | 有直接同类，但多为通用压缩 | 1 | 3 | 1 | 5 | 中 |
| `optimize-docs` | 文档压缩/标准化高度通用 | 1 | 2 | 1 | 4 | 低 |
| `optimize-github-llm-seo` | LLM SEO/AI SEO 候选多，Top 候选 3.6K installs | 1 | 2 | 2 | 5 | 中 |
| `optimize-skill` | 直接同构不多，但元技能竞争存在 | 2 | 4 | 1 | 7 | 中 |
| `plan-implementation` | 计划类 skill 很多，Top 候选 6.9K installs | 1 | 4 | 2 | 7 | 中 |
| `review-code-changes` | code review 极拥挤，Top 候选 14.4K installs | 1 | 4 | 2 | 7 | 中 |
| `review-dialogue-quality` | 直接同构较少，近邻多为 prompt/dialogue 优化 | 2 | 3 | 1 | 6 | 中 |
| `search-github` | GitHub search 类较多，已有成熟替代 | 1 | 3 | 1 | 5 | 中 |
| `search-skills-sh` | skills 搜索类不多，但可替代 | 2 | 3 | 1 | 6 | 中 |

## 逐项结论
- `tapd-fetch-and-archive`：价值高；场景强专用且自带脚本，已从“提示词”进入“可执行能力”；风险是 TAPD 场景窄，外部分发受限
- `use-fire-keeper`：价值高；直接锁定本仓依赖语义，能减少 API 漂移；风险是脱离 `fire-keeper` 后可移植性弱
- `agent-browser`：价值中；市场替代多，但本地文档深、模板全，适合作为团队标准用法沉淀；短板是不具独家能力
- `optimize-claude-md`：价值中；约束清晰且绑定本仓 `AGENTS.md/CLAUDE.md` 规则；短板是主题窄、替代性高
- `optimize-docs`：价值低；目标通用、替代很多、资产浅；保留价值主要在于充当其他文档 skill 的底层模板
- `optimize-github-llm-seo`：价值中；需求真实且自带模板资产；短板是 skills.sh 上营销/SEO 类供给很强
- `optimize-skill`：价值中；属于本仓关键元技能，直接服务 skill 生命周期；短板是当前更像规范汇编，自动化资产偏少
- `plan-implementation`：价值中；项目约束强，和 `/plans/task_plan_{suffix}.md` 深绑定；短板是公共计划类 skill 竞争激烈
- `review-code-changes`：价值中；本地版加入结构治理与自动修复，强于纯 checklist；短板是 code review 赛道过于拥挤
- `review-dialogue-quality`：价值中；能补充成本/质量复盘；短板是执行杠杆偏低，更像治理辅助
- `search-github`：价值中；实用但工具性强，容易被通用 skill 替代；短板是差异点主要停留在参数约束
- `search-skills-sh`：价值中；对本仓“找 skill/对标 skill”流程有直接支持；短板是上游 CLI 一旦增强，本地封装价值会下降

## 结论
- 高价值：
- `tapd-fetch-and-archive` · `use-fire-keeper`
- 中价值但应演进：
- `agent-browser` · `optimize-claude-md` · `optimize-github-llm-seo` · `optimize-skill` · `plan-implementation` · `review-code-changes` · `review-dialogue-quality` · `search-github` · `search-skills-sh`
- 低价值：
- `optimize-docs`
- 优先增强对象：
- `optimize-skill`：补自动骨架生成/触发冲突检查
- `review-code-changes`：补更强的验证闭环证据
- 当前执行决议：
- 保留：`tapd-fetch-and-archive` · `use-fire-keeper`
- 演进：`optimize-claude-md` · `optimize-skill` · `plan-implementation` · `review-code-changes` · `search-github` · `search-skills-sh`
- 不处理：`agent-browser`
- 删除：`optimize-docs` · `optimize-github-llm-seo` · `review-dialogue-quality`
- 若按“对外分发价值”而非“项目内价值”排序：
- `tapd-fetch-and-archive` 会下降，`agent-browser/review-code-changes` 会上升
