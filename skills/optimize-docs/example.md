---
name: feature-doc-template
description: 功能文档模板，use when documenting new feature behavior and usage
---

# Feature Doc Template

## 何时使用
- 为新特性撰写行为/使用说明，use when documenting new feature behavior and usage
- 需要提供快速上手、关键约束、常见问题

## 效率优先
- Read/Edit/Bash > Task · 不调用子代理 · 一次性 Edit 合并修改

## 核心原则
- 仅写项目特定信息；移除通用框架/语言基础
- 高频信息前置：快速开始/约束/常见问题
- 行数 ≤200，示例精简但可运行/可验证

## 工作流程
1. 确认需求：目标用户、预期行为、输入输出
2. 收集上下文：接口/配置/依赖版本
3. 写快速开始：最小可运行示例 + 验证方式
4. 列核心约束：限流/权限/兼容性/已知问题
5. 补充细节：参数说明、错误码、FAQ
6. 返回信息：提供完成行数和验证方式

## 快速开始
```bash
curl -X POST https://api.example.com/feature \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"demo"}'
# 预期：返回 200，body 含 id
```

## 核心约束
- 权限：需要 `feature:write`
- 兼容性：客户端版本 ≥1.4
- 限流：每分钟 60 次

## 常见错误
- 401：检查 token
- 429：命中限流，稍后重试
- 500：记录 request-id，联系后端

## 返回信息
- ✓ 已优化至 60 行，可直接复用
- 验证：按“快速开始”运行，确认 200 且返回 id；返回前自检行数/清单
