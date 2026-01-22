---
name: optimize-github-llm-seo
description: 优化 GitHub 仓库的 LLM 可发现性并输出诊断与模板建议，use when auditing GitHub repos for LLM discovery, llms.txt/README section drafting, or topic/metadata improvement
allowed-tools: Bash
---

# GitHub LLM "SEO" 优化器

## 何时使用

- 需要对 GitHub 仓库做 LLM 友好度诊断并产出报告
- 需要生成 llms.txt、llms.md、README 片段或 topics 建议

## 核心意图

- 让 LLM 更容易理解、检索和引用仓库内容

## 效率优先

- `rg`/`ls`/`sed` + 静态阅读优先，必要时用 `gh` 获取元数据

## 核心约束

- 默认只输出报告与模板，不做修改；任何编辑或 `gh repo edit` 必须先确认
- 中文输出；保持简洁
- 尊重仓库结构与现有约定，避免引入不必要文件

## 输入/输出契约

- 输入: 仓库路径、仓库 URL(可选)、目标受众/领域关键词、是否允许 `gh`
- 输出: 报告(按严重度排序) + 模板草案 + 待确认的修改清单

## 工作流程

1. 确认需求与范围(报告式/是否允许 `gh`/目标受众)
2. 读取 README、docs、examples、CHANGELOG/RELEASES(如有)
3. 若允许 `gh`，获取 description/homepage/topics 等元数据
4. 判断项目核心意图(定位/目标受众/关键问题)
5. 判断项目命名是否与核心意图和关键词一致
6. 评估可发现性信号: 简明定位、关键词、结构化教程、API/示例、许可证/引用
7. 可选: 查看 GitHub 搜索结果用于校准摘要/关键词，仅作诊断信号
8. 生成报告与改进建议；从 assets 模板生成草案
9. 列出可执行修改并询问确认
10. 返回信息: 报告+模板+下一步选项

## 快速参考

- `gh repo view OWNER/REPO --json description,homepageUrl,topics` 仅用于读取元数据
- 模板位置: `assets/llms.txt`, `assets/llms.md`, `assets/README_LLM_SEO_SECTION.md`, `assets/REPORT_TEMPLATE.md`, `assets/TOPICS_TEMPLATE.txt`

## 注意事项

- 不承诺搜索引擎排名，仅提升 LLM 可读性与可索引性
- 私有仓库内容不外泄；报告只引用必要片段
- 搜索结果用于观察可见元数据与定位准确性，校准摘要/关键词
- 搜索结果用于对标与缺口发现，不用于堆词或追排名

## 成功标准

- 报告含: 现状摘要、问题列表、优先级、建议、模板草案
- 未经确认不修改任何文件或远程元数据

## 检查清单

- [ ] README 是否有清晰一句话定位与关键词
- [ ] 核心意图是否清晰且一致
- [ ] 项目命名是否与核心意图/受众/关键词匹配
- [ ] 是否有可复制的安装/使用示例
- [ ] 是否有 API/接口说明或链接
- [ ] 是否有示例、FAQ、限制/已知问题
- [ ] 是否有 license、citation、contributing、security
- [ ] 是否提供 llms.txt/llms.md 或等价说明
