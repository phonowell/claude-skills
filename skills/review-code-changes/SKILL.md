---
name: review-code-changes
description: 自动复盘并修复代码改动，验证真实性/正确性/优雅性/最小化，use when code modifications need quality review
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# 代码修改复盘验证

## 何时使用
- 代码改动完成后执行质量复盘
- 目标：真实性/正确性/优雅性/最小化全部通过

## 核心意图
通过多轮检查和自动修复，阻断低质量改动进入主分支，避免屎山化扩散。

## 效率优先
Read/Grep/Bash > Task · 并行<=3 · 默认只审最近差异

## 核心约束
1. 范围仅限用户指定区域或最近 diff
2. 每个问题必须给出文件位置与修复建议
3. 不引入新需求，不做过度重构
4. 结构治理必须执行：按 `references/review-checklist.md` 处理屎山征兆与行数治理（30~200 / >200 拆分 / <30 同域合并）
5. 发现问题先修复再继续，不等待人工确认；改动超过 500 行必须按模块分批
6. 分级：P0 阻塞、P1 合并前修复、P2 本轮修复或登记、P3 可选
7. 冲突时优先级：核心约束 > `review-checklist` > 示例；输出必须遵循 `references/output-template.md`

## 输入/输出契约
- 输入：`git diff` 或指定范围、规范来源、可用测试命令
- 输出：按 `references/output-template.md` 的复盘结果
- 成功：`✓ 代码复盘完成，满足所有质量要求`
- 失败：`✗ 复盘中断：{原因}`

## 附件映射
- `references/preflight.md`
- `references/review-checklist.md`
- `references/output-template.md`

## 工作流程
1. 预检：按 `preflight` 明确目标、范围、风险
2. 锁定改动：优先 `git diff`
3. 统计行数并决定是否分批（总改动 >500 行分批）
4. 按 `review-checklist` 执行四维复盘与结构治理
5. 按 P0-P3 自动修复并做最小验证
6. 未通过则继续循环复盘
7. 末轮执行 `lint/type-check/test`（不可执行需注明）
8. 按输出模板汇总并返回状态

## 检查清单
- [ ] 范围与风险已预检
- [ ] 大改动已分批闭环
- [ ] 已完成行数治理（30~200 / >200 拆分 / <30 同域合并）
- [ ] 问题有位置、有建议、有修复
- [ ] 已执行必要验证
- [ ] 输出格式符合模板
