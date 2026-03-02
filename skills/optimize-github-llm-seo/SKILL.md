---
name: optimize-github-llm-seo
description: 优化 GitHub 仓库的 LLM 可发现性并输出诊断与模板建议，use when auditing GitHub repos for LLM discovery, llms.txt/README section drafting, or topic/metadata improvement
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# GitHub LLM SEO 优化器

## 何时使用
- 需要审计仓库的 LLM 可发现性
- 需要生成 `llms.txt`/`llms.md`/README 片段/topics 建议

## 核心意图
输出可执行诊断与模板草案，提升仓库被 LLM 理解和引用的效率。

## 效率优先
`rg/ls/sed` 静态读取 > `gh` 元数据查询 > 其他方案

## 核心约束
1. 默认仅输出报告与模板；编辑文件或 `gh repo edit` 必须先确认
2. 中文输出，结论按严重度排序
3. 尊重现有仓库结构，不引入无必要文件
4. 模板字段与主文契约一致
5. 不承诺搜索排名，只关注可发现性与可读性

## 输入/输出契约
- 输入：仓库路径、可选仓库 URL、目标受众关键词、是否允许 `gh`
- 输出：问题清单、优先级、模板草案、待确认变更项
- 成功：`✓ 检查完成`
- 失败：`✗ 中断：{原因}`

## 附件映射
- `assets/REPORT_TEMPLATE.md`
- `assets/llms.txt`
- `assets/llms.md`
- `assets/README_LLM_SEO_SECTION.md`
- `assets/TOPICS_TEMPLATE.txt`

## 工作流程
1. 确认范围：仅报告或报告+草案；确认是否允许 `gh`
2. 读取本地资料：README/docs/examples/CHANGELOG
3. 可选读取元数据：`gh repo view ... --json description,homepageUrl,topics`
4. 识别核心定位：受众、场景、关键词、差异点
5. 评估信号：标题摘要、关键词覆盖、教程/API/示例、许可证与引用信息
6. 产出报告：按严重度列问题与修复建议
7. 生成模板：按 assets 填充最小草案
8. 列出待确认修改清单并输出状态

## 检查清单
- [ ] 未经确认不执行写入或远程编辑
- [ ] 报告与模板字段完整
- [ ] 结论可追溯到文件或元数据
- [ ] 返回信息符合约定
