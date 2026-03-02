---
name: search-skills-sh
description: 使用 skills CLI 检索 skills.sh 技能并输出筛选理由，use when searching skills on skills.sh with npx skills find
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# Skills.sh Skill Search

## 何时使用
- 需要按关键词在 skills.sh 搜索可安装 skill
- 需要输出 `owner/repo@skill` 与可执行安装命令
- 仅允许 CLI 检索，不做浏览器自动化

## 核心意图
通过 `npx skills find` 输出可复核候选与筛选理由。

## 效率优先
`npx skills find` > `npx skills add <id> --list` 校验

## 核心约束
1. 仅检索，不执行真实安装
2. 输出至少 5 个候选；不足必须标注“候选不足”
3. 去重：同仓库保留最相关 1 个；同名保留安装量最高项
4. 每条记录必须包含 `id/url/installs/reason/installCmd/confidence`
5. 可信度分级：`high/medium/low`
6. `No SKILL.md available` 仅允许做元信息比较

## 输入/输出契约
- 输入：关键词、候选数、排序偏好
- 输出：候选列表与筛选理由
- 成功：`✓ 已完成 skills.sh 技能检索`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 确认参数：关键词、数量、是否允许 `--list` 核验
2. 运行检索：`npx skills find "<query>" | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g'`
3. 提取字段：`owner/repo@skill`、installs、url
4. 可选核验：Top1-3 执行 `npx skills add <id> --list`
5. 去重收敛：保留 5-10 个候选
6. 标注可信度并归纳理由
7. 输出候选与状态

## 检查清单
- [ ] CLI-only 且无安装副作用
- [ ] 字段完整且含 `confidence`
- [ ] 候选数达到要求或已说明不足
- [ ] 去重规则已执行
- [ ] 返回信息符合约定
