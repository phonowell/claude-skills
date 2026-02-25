---
name: optimize-docs-example
description: 通用文档优化示例，use when adapting optimize-docs workflow to real markdown files
---

# optimize-docs 示例

## 何时使用

- 将 `optimize-docs` 规则映射到真实文档时
- 需要参考“输入→优化动作→输出”最小闭环

## 效率优先

- Read/Edit/Bash > Task · 并行≤3 · 一次性 Edit

## 输入示例

```
文件：docs/feature-a.md
现状：268 行；包含安装科普/重复 FAQ/失效链接
保留：命令、版本兼容、错误码、FAQ
```

## 优化动作

1. 运行 `wc -l docs/feature-a.md` 建基线
2. 删除通用知识与重复段
3. 合并同类约束并前置高频信息
4. 复查命令/路径/链接可执行性
5. 再次 `wc -l` 并确认 ≤200 行

## 压缩示例

```md
Before:
- Node.js 是一个 JavaScript 运行时...
- 我们推荐你先阅读 JavaScript 基础...

After:
- 环境要求：Node 20+
- 安装：`pnpm i`
```

## 输出示例

- ✓ 已优化至 176 行
- ✓ 失效链接已修复 3 处
- ✗ 中断：若关键段缺失且无法确认
