---
name: audit-skill-lifecycle
description: 项目级治理 skills.sh 技能生命周期并控制安装风险，use when users ask to evaluate/search/add/remove/replace project skills or decide whether a new project skill is needed
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Skill Lifecycle Auditor

## 何时使用
- 用户要求评估/搜索/新增/替换/移除 skills
- 用户询问是否需要新增 skill
- 与 skill 生命周期无关的实现类需求不触发

## 核心意图
以最小安装集完成任务，给出可审计的选型、安装、清理决策。

## 效率优先
Read/Grep/Glob/Bash > Task · 并行<=3 · 一次性 Edit

## 核心约束
1. 先复用已安装与本地 skill，再考虑新增
2. 候选检索必须委托 `search-skills-sh`，且必须等待完成
3. 仅允许项目级安装/移除，禁止 `-g` 与全局变更
4. 候选必须评分；总分低于阈值不安装
5. `one-off` 任务完成后必须清理并复核
6. 禁止删除项目自有 skill 目录

## 输入/输出契约
- 输入：任务目标、约束文件（`AGENTS.md`/`CLAUDE.md`）
- 输出：覆盖结论、候选评分、门禁结果、执行命令、生命周期处理
- 成功：`✓ lifecycle audited`
- 失败：`✗ lifecycle blocked: {reason}`

## 工作流程
1. 建立任务画像：`domain/action/output/reuse_horizon`
2. 覆盖检查：`npx skills list` + 本地目录扫描；已覆盖则直接复用
3. 委托检索：调用 `search-skills-sh`，以其输出作为唯一候选源
4. 候选收敛：保留 1-2 主候选 + 1 备选并评分（`task_fit/scope_fit/overlap_risk/maintainability/one_off_risk`）
5. 安全门禁：`curl` 仓库元信息 + `npx skills add <id> --list`
6. 阻断策略：仓库不可访问/归档/禁用/`--list` 为空则阻断；仅用户明确确认才可越过
7. 项目级安装：`npx skills add <owner/repo@skill> --yes`
8. one-off 清理：`npx skills remove <skill-name> --yes` 后 `npx skills list` 复核
9. 返回信息：输出审计摘要与状态

## 检查清单
- [ ] 已完成复用优先检查
- [ ] 检索由 `search-skills-sh` 完成且已等待
- [ ] 评分与门禁结论可追溯
- [ ] 仅项目级命令，无全局副作用
- [ ] 返回信息符合约定
