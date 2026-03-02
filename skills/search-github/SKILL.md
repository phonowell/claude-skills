---
name: search-github
description: 使用 gh CLI 搜索 GitHub 仓库并输出筛选理由，use when searching GitHub repositories with gh cli
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# GitHub Repo Search

## 何时使用
- 需要按关键词和过滤条件检索 GitHub 仓库
- 需要输出可复核的筛选理由与元数据
- 仅使用 CLI，不使用浏览器自动化

## 核心意图
基于 `gh search repos` 提供可复制、可追溯的候选仓库列表。

## 效率优先
`gh search repos` > `gh api search/repositories` 降级路径

## 核心约束
1. 仅搜索 repos，不查 code/issues/users
2. 只读检索，禁止删除或修改类 gh 命令
3. 排序参数化：`stars`/`recent-activity`/`topic-match`
4. 输出字段必须包含 `fullName/url/stargazersCount/createdAt/updatedAt/reason/sortStrategy`
5. 筛选理由必须可追溯到查询词与过滤条件

## 输入/输出契约
- 输入：关键词、过滤条件、结果数、排序策略
- 输出：候选列表与筛选理由
- 成功：`✓ 已完成 GitHub 仓库检索`
- 失败：`✗ 中断：{原因}`

## 工作流程
1. 确认参数：关键词/过滤条件/N/排序策略
2. 组装查询：合并 `language/stars/created/pushed/topic` 限定词
3. 排序映射：`stars -> stars`，`recent-activity -> updated`，`topic-match -> updated`（并要求查询含 `topic:`）
4. 执行主命令：`gh search repos "<query>" --limit N --sort <mappedSort> --order desc --json ...`
5. 失败重试：指数退避 2s/4s，共 2 次
6. 降级执行：`gh api search/repositories -f q="<query>" -f sort=<mappedSort> ...`
7. 归纳理由：关键词命中、活跃度、星数、topic
8. 输出结果与状态

## 检查清单
- [ ] `gh auth status` 已登录
- [ ] 字段齐全且理由可追溯
- [ ] 排序策略与命令映射一致
- [ ] 已执行重试与降级策略
- [ ] 无写操作副作用
- [ ] 返回信息符合约定
