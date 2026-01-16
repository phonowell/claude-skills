---
name: data-migration-playbook
description: 数据迁移执行手册，use when planning/executing DB migration
---

# Data Migration Playbook

## 何时使用
- 计划或执行数据库迁移，use when planning/executing DB migration
- 评估迁移风险、编排步骤、回滚验证

## 核心意图
- 在受控窗口完成迁移，降低风险并可审计

## 效率优先
- Read/Glob/Write/Edit/Bash > Task · 并行≤3 · 一次性 Edit

## 核心约束
- Runbook 可复用且可审计；仅记录项目特定步骤/脚本
- 行数：主文 ≤100；附属文档 ≤200

## 工作流程
1. 确认需求：版本/窗口/影响面，缺失信息先问
2. 定位资料：收集 schema 变更、依赖脚本、变更窗口
3. 编排计划：备份→停写→迁移→验证→放行，注明超时与回滚条件
4. 执行前检查：备份路径/权限/流量阈值已确认
5. 执行迁移：按计划跑脚本，记录输出
6. 验证/回滚：校验指标，失败触发回滚流程
7. 返回信息：提供结果摘要、日志位置、未决风险

## 示例命令
- 备份：`pg_dump ... > backup.sql`
- 迁移：`psql -f migrations.sql`
- 验证：`SELECT count(*) ...`

## 注意事项
- 未确认停机/写入冻结前禁止执行
- 所有脚本需在预生产演练通过后再跑正式

## 检查清单
- [ ] 确认窗口/回滚方案
- [ ] 备份完成且可恢复
- [ ] 验证脚本已准备
- [ ] 返回信息已包含结果+日志
