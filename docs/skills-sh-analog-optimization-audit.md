# Skills.sh 同类技能对标与优化点（排除 agent-browser）

## 方法
- 时间：2026-03-02
- 检索命令：`npx skills find "<query>" | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g'`
- 范围：`skills/*/SKILL.md` 中除 `agent-browser` 外的 12 个技能
- 输出字段：`owner/repo@skill`、`installs`、URL、可参考优化点

## 结果

### audit-skill-lifecycle
- 查询词：`skill governance`
- 同类技能：
- `jwynia/agent-skills@governance-systems`（50）https://skills.sh/jwynia/agent-skills/governance-systems
- `groeimetai/snow-flow@grc-compliance`（38）https://skills.sh/groeimetai/snow-flow/grc-compliance
- `erichowens/some_claude_skills@dag-skill-registry`（22）https://skills.sh/erichowens/some_claude_skills/dag-skill-registry
- 可参考优化点：
- 增加“治理策略档位”（strict/balanced/fast）以减少一刀切门禁
- 增加“安装决策日志字段”模板（理由、风险、回滚命令、责任人）
- 相关性：中

### init-worktree
- 查询词：`git worktree workflow`
- 同类技能：
- `everyinc/compound-engineering-plugin@git-worktree`（164）https://skills.sh/everyinc/compound-engineering-plugin/git-worktree
- `vamseeachanta/workspace-hub@git-worktree-workflow`（23）https://skills.sh/vamseeachanta/workspace-hub/git-worktree-workflow
- `laurigates/claude-plugins@git-worktree-agent-workflow`（18）https://skills.sh/laurigates/claude-plugins/git-worktree-agent-workflow
- 可参考优化点：
- 补充多并行 worktree 的命名规范与冲突回收策略
- 增加失败恢复分支（rebase 冲突/目录残留/重复槽位）
- 相关性：高

### optimize-claude-md
- 查询词：`claude md optimization`
- 同类技能：
- `daymade/claude-code-skills@claude-md-progressive-disclosurer`（93）https://skills.sh/daymade/claude-code-skills/claude-md-progressive-disclosurer
- `adaptationio/skrillz@auto-claude-optimization`（14）https://skills.sh/adaptationio/skrillz/auto-claude-optimization
- `adaptationio/skrillz@claude-cost-optimization`（12）https://skills.sh/adaptationio/skrillz/claude-cost-optimization
- 可参考优化点：
- 增加“信息渐进披露层级检查”清单（核心/扩展/附录）
- 增加 token 成本前后对比字段（压缩前后行数与估算 token）
- 相关性：中-高

### optimize-docs
- 查询词：`markdown documentation optimization`
- 同类技能：
- `microsoft/github-copilot-for-azure@markdown-token-optimizer`（117）https://skills.sh/microsoft/github-copilot-for-azure/markdown-token-optimizer
- `terrylica/cc-skills@documentation-standards`（45）https://skills.sh/terrylica/cc-skills/documentation-standards
- `nkootstra/skills@compact-markdown`（14）https://skills.sh/nkootstra/skills/compact-markdown
- 可参考优化点：
- 增加“token 密度指标”与阈值（每段最大行数/重复率）
- 增加文档标准化检查（标题层级、术语一致、示例最小化）
- 相关性：高

### optimize-github-llm-seo
- 查询词：`llms txt github seo`
- 同类技能：
- `coreyhaines31/marketingskills@ai-seo`（3.6K）https://skills.sh/coreyhaines31/marketingskills/ai-seo
- `dirnbauer/webconsulting-skills@ai-search-optimization`（84）https://skills.sh/dirnbauer/webconsulting-skills/ai-search-optimization
- `montagao/skills@llm-seo`（12）https://skills.sh/montagao/skills/llm-seo
- 可参考优化点：
- 增加“可观测 KPI”模板（索引覆盖率、抓取入口、摘要命中率）
- 增加 llms.txt/README/topic 三层一致性检查表
- 相关性：高

### optimize-skill
- 查询词：`skill authoring optimization`
- 同类技能：
- `zaggino/z-schema@skill-creator`（19）https://skills.sh/zaggino/z-schema/skill-creator
- `aaaaqwq/claude-code-skills@skill-search-optimizer`（6）https://skills.sh/aaaaqwq/claude-code-skills/skill-search-optimizer
- `workleap/wl-web-configs@workleap-skill-optimizer`（5）https://skills.sh/workleap/wl-web-configs/workleap-skill-optimizer
- 可参考优化点：
- 增加“触发词碰撞检测”步骤，避免新旧 skill 触发重叠
- 增加“最小模板生成”输出（frontmatter+流程骨架）减少手写偏差
- 相关性：中

### plan-implementation
- 查询词：`implementation planning`
- 同类技能：
- `masayuki-kono/agent-skills@implementation-plan`（33）https://skills.sh/masayuki-kono/agent-skills/implementation-plan
- `antinomyhq/forge@create-plan`（27）https://skills.sh/antinomyhq/forge/create-plan
- `desplega-ai/ai-toolbox@tdd-planning`（20）https://skills.sh/desplega-ai/ai-toolbox/tdd-planning
- 可参考优化点：
- 增加计划模式分流（实现计划/研究计划/TDD 计划）
- 增加每阶段退出条件与回滚条件，降低执行中漂移
- 相关性：高

### review-code-changes
- 查询词：`code review`
- 同类技能：
- `obra/superpowers@requesting-code-review`（14.4K）https://skills.sh/obra/superpowers/requesting-code-review
- `obra/superpowers@receiving-code-review`（11.6K）https://skills.sh/obra/superpowers/receiving-code-review
- `wshobson/agents@code-review-excellence`（5.9K）https://skills.sh/wshobson/agents/code-review-excellence
- 可参考优化点：
- 增加“双相流程”显式拆分：提交前自检 vs 收到反馈后修正
- 增加严重度分级到动作映射（blocker/high/medium/low -> 必做动作）
- 相关性：高

### review-dialogue-quality
- 查询词：`prompt optimizer`
- 同类技能：
- `daymade/claude-code-skills@prompt-optimizer`（200）https://skills.sh/daymade/claude-code-skills/prompt-optimizer
- `eddiebe147/claude-settings@llm-prompt-optimizer`（51）https://skills.sh/eddiebe147/claude-settings/llm-prompt-optimizer
- `chujianyun/skills@prompt-optimizer`（40）https://skills.sh/chujianyun/skills/prompt-optimizer
- 可参考优化点：
- 增加对话质量量化维度（目标清晰度/约束完整度/可执行性）
- 增加“低质量输入重写模板”以减少来回澄清成本
- 相关性：中

### search-github
- 查询词：`github repository search`
- 同类技能：
- `hoodini/ai-agents-skills@github-trending`（205）https://skills.sh/hoodini/ai-agents-skills/github-trending
- `parcadei/continuous-claude-v3@github-search`（181）https://skills.sh/parcadei/continuous-claude-v3/github-search
- `otrebu/agents@gh-code-search`（42）https://skills.sh/otrebu/agents/gh-code-search
- 可参考优化点：
- 增加排序策略参数化（stars/recent activity/topic match）
- 增加 gh API 失败时的降级路径与重试策略
- 相关性：高

### search-skills-sh
- 查询词：`skills.sh search`
- 同类技能：
- `f/awesome-chatgpt-prompts@skill-lookup`（1.2K）https://skills.sh/f/awesome-chatgpt-prompts/skill-lookup
- `f/prompts.chat@skill-lookup`（232）https://skills.sh/f/prompts.chat/skill-lookup
- `tejasdc/skills-search@skill-search`（14）https://skills.sh/tejasdc/skills-search/skill-search
- 可参考优化点：
- 增加候选去重规则（同仓库多 skill 去重、同名 skill 合并）
- 增加结果可信度标签（高安装量/关键词强匹配/仅元信息）
- 相关性：高

### use-fire-keeper
- 查询词：`filesystem operations`
- 同类技能：
- `oimiragieo/agent-studio@filesystem`（41）https://skills.sh/oimiragieo/agent-studio/filesystem
- `chaterm/terminal-skills@file-operations`（11）https://skills.sh/chaterm/terminal-skills/file-operations
- `sundial-org/awesome-openclaw-skills@filesystem`（7）https://skills.sh/sundial-org/awesome-openclaw-skills/filesystem
- 可参考优化点：
- 增加操作能力矩阵（glob/copy/isSame/promptAction 的适用边界）
- 增加并发任务安全约束（冲突路径检测、失败回滚策略）
- 相关性：中

## 备注
- `audit-skill-lifecycle` 与 `use-fire-keeper` 在 skills.sh 上直接同构技能较少，结论偏“治理模式/文件操作模式”相似，不等于功能完全同构。
