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
| `tapd-story-archiver` | 弱相关候选，缺直接同构 | 3 | 4 | 3 | 10 | 高 |
| `fire-keeper-guide` | 仅文件系统近邻，无 fire-keeper 同构 | 3 | 4 | 2 | 9 | 高 |
| `agent-browser` | 浏览器自动化高度拥挤，Top 候选 204 installs | 1 | 2 | 3 | 6 | 中 |
| `claude-md-improver` | 已直接采用 skills.sh 同类优选 | 1 | 2 | 2 | 5 | 中 |
| `optimize-docs` | 文档压缩/标准化高度通用 | 1 | 2 | 1 | 4 | 低 |
| `optimize-github-llm-seo` | LLM SEO/AI SEO 候选多，Top 候选 3.6K installs | 1 | 2 | 2 | 5 | 中 |
| `optimize-skill` | 直接同构不多，但元技能竞争存在 | 2 | 4 | 1 | 7 | 中 |
| `implementation-planner` | 计划类 skill 很多，Top 候选 6.9K installs | 1 | 4 | 2 | 7 | 中 |
| `code-reviewer` | code review 极拥挤，Top 候选 14.4K installs | 1 | 4 | 2 | 7 | 中 |
| `review-dialogue-quality` | 直接同构较少，近邻多为 prompt/dialogue 优化 | 2 | 3 | 1 | 6 | 中 |
| `search-github` | GitHub search 类较多，已有成熟替代 | 1 | 3 | 1 | 5 | 中 |
| `search-skills-sh` | skills 搜索类不多，但可替代 | 2 | 3 | 1 | 6 | 中 |

## 逐项结论
- `tapd-story-archiver`：价值高；场景强专用且自带脚本，已从“提示词”进入“可执行能力”；风险是 TAPD 场景窄，外部分发受限
- `fire-keeper-guide`：价值高；直接锁定本仓依赖语义，能减少 API 漂移；风险是脱离 `fire-keeper` 后可移植性弱
- `agent-browser`：价值中；市场替代多，但本地文档深、模板全，适合作为团队标准用法沉淀；短板是不具独家能力
- `claude-md-improver`：价值中；已直接复用 skills.sh 上更完整的同类技能；短板是对本仓约束绑定弱于原本地版
- `optimize-docs`：价值低；目标通用、替代很多、资产浅；保留价值主要在于充当其他文档 skill 的底层模板
- `optimize-github-llm-seo`：价值中；需求真实且自带模板资产；短板是 skills.sh 上营销/SEO 类供给很强
- `optimize-skill`：价值中；属于本仓关键元技能，直接服务 skill 生命周期；短板是当前更像规范汇编，自动化资产偏少
- `implementation-planner`：价值中；项目约束强，和 `/plans/task_plan_{suffix}.md` 深绑定；短板是公共计划类 skill 竞争激烈
- `code-reviewer`：价值中；本地版加入结构治理与自动修复，强于纯 checklist；短板是 code review 赛道过于拥挤
- `review-dialogue-quality`：价值中；能补充成本/质量复盘；短板是执行杠杆偏低，更像治理辅助
- `search-github`：价值中；实用但工具性强，容易被通用 skill 替代；短板是差异点主要停留在参数约束
- `search-skills-sh`：价值中；对本仓“找 skill/对标 skill”流程有直接支持；短板是上游 CLI 一旦增强，本地封装价值会下降

## 结论
- 高价值：
- `tapd-story-archiver` · `fire-keeper-guide`
- 中价值但应演进：
- `agent-browser` · `claude-md-improver` · `optimize-github-llm-seo` · `optimize-skill` · `implementation-planner` · `code-reviewer` · `review-dialogue-quality` · `search-github` · `search-skills-sh`
- 低价值：
- `optimize-docs`
- 优先增强对象：
- `optimize-skill`：补自动骨架生成/触发冲突检查
- `code-reviewer`：补更强的验证闭环证据
- 当前执行决议：
- 保留：`tapd-story-archiver` · `fire-keeper-guide`
- 演进：`claude-md-improver` · `optimize-skill` · `implementation-planner` · `code-reviewer` · `search-github` · `search-skills-sh`
- 不处理：`agent-browser`
- 删除：`optimize-docs` · `optimize-github-llm-seo` · `review-dialogue-quality`
- 若按“对外分发价值”而非“项目内价值”排序：
- `tapd-story-archiver` 会下降，`agent-browser/code-reviewer` 会上升
