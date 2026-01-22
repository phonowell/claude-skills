---
name: search-github
description: 使用 gh CLI 搜索 GitHub 仓库并输出筛选理由，use when searching GitHub repositories with gh cli
---

# GitHub Repo Search

## 何时使用

- 需要在 GitHub 上按关键词/条件检索仓库并给出结果说明时
- 仅允许使用 CLI 工具，不使用浏览器

## 核心意图

- 用 `gh search repos` 快速定位仓库，输出可复核的筛选理由与关键元数据

## 效率优先

- gh CLI（GitHub 官方 CLI）> curl + API > browser，优先结构化 JSON

## 前置条件

- `gh auth status` 为已登录状态

## 核心约束

- 仅搜索仓库，不查 code/issues/users
- 只读检索，不执行任何删除/修改类 gh 命令
- 输出字段：`fullName`/`url`/`stargazersCount`/`createdAt`/`updatedAt` + 筛选理由
- 筛选理由必须可追溯到查询词与过滤条件

## 工作流程

1. 确认需求（强制）：查询关键词、过滤条件、结果数量、排序规则
2. 生成查询：合并关键词与限定词（如 `language:`/`stars:`/`created:`/`pushed:`）
3. 执行搜索：`gh search repos "<query>" --limit N --sort <stars|updated> --order desc --json fullName,url,stargazersCount,createdAt,updatedAt,description`
4. 归纳理由：逐条说明匹配点（关键词命中/星数区间/更新时间/语言等）
5. 返回信息：表格或列表输出，列含 `fullName/url/stargazersCount/createdAt/updatedAt/reason`，必要时补充未命中说明

## 语法防错

- 含排除条件时使用 `--`：`gh search repos -- "vector -language:java"`
- 多词查询用引号包裹：`"vector database"`
- PowerShell 可用 `gh --% search repos -- "vector -language:java"`

## 示例

- 查询：`"vector database" language:python stars:>500 pushed:>2023-01-01`
- 命令：`gh search repos "vector database language:python stars:>500 pushed:>2023-01-01" --limit 10 --sort stars --order desc --json fullName,url,stargazersCount,createdAt,updatedAt,description`

## 输出模板

- reason 示例：`关键词: vector database; stars:>500; pushed:>2023-01-01; language:python`

## 注意事项 / 错误处理

- 若 `gh` 未登录，先运行 `gh auth login`
- 在有沙箱的环境中执行 `gh` 命令需申请提权
- 如需更高精度，优先调整查询词而不是后处理过滤
- 结果为空时，反馈已使用的查询与建议的放宽条件

## 成功标准与自测

- 字段完整：星数/创建时间/最后更新时间/筛选理由
- 理由可追溯、无主观评价
- 命令可复制运行且结果与描述一致

## 检查清单

- [ ] Frontmatter 完整，name/description 符合规则
- [ ] 仅仓库搜索，CLI-only
- [ ] 含核心意图/效率优先/工作流程/返回信息步骤
- [ ] 行数 ≤100
