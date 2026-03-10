---
name: tapd-fetch-and-archive
description: 归档 TAPD story 原始正文并生成溯源 meta，use when archiving TAPD story by URL/ID into target repository with CDP first and curl fallback
allowed-tools: Bash, Read, Write, Edit
---

# TAPD 抓取归档

## 何时使用
- 需要把 TAPD story 正文归档到目标仓库 `docs/requirements`
- 需要保留原始正文与可审计元信息（URL/时间/抓取方式/校验）
- 需要优先复用本机已登录浏览器会话（CDP），失败再走 curl

## 核心意图
稳定生成 `tapd-<id>-original.md` 与 `tapd-<id>-original.meta.md`，并在失败时提供可执行修复步骤。

## 命令入口
- `pnpm tapd:archive -- --repo-path <repo> --story-url <url>`
- `pnpm tapd:archive -- --repo-path <repo> --story-id <id>`
- `node skills/tapd-fetch-and-archive/scripts/fetch-and-archive.js ...`

## 参数
- `--repo-path` 必填：目标仓库根目录
- `--story-id` / `--story-url` 二选一：story 标识
- `--cdp-port` 可选：默认 `9334`
- `--overwrite` 可选：覆盖已存在 `original.md`
- `--out-dir` 可选：默认 `<repo-path>/docs/requirements`，支持绝对路径

## 输出文件
- `<out-dir>/tapd-<id>-original.md`
- `<out-dir>/tapd-<id>-original.meta.md`

## 执行示例
```bash
pnpm tapd:archive -- \
  --repo-path /Users/mimiko/Projects/2026-03-debut-or-bust \
  --story-url "https://www.tapd.cn/xxx/prong/stories/view/1122299541004808079"
```

```bash
pnpm tapd:archive -- \
  --repo-path /Users/mimiko/Projects/2026-03-debut-or-bust \
  --story-id 1122299541004858557 \
  --cdp-port 9334 \
  --overwrite
```

## 幂等与校验
- `original.md` 已存在且未传 `--overwrite` 时默认不覆盖，仅更新 meta
- 自动校验：非空、首个非空行为正文、非登录页/403/重定向误抓
- 校验失败：进程非 0 退出，meta 写入失败原因与修复步骤

## curl 回退环境变量
- `TAPD_COOKIE`: cookie 字符串
- `TAPD_HEADERS_JSON`: 额外请求头 JSON
- `TAPD_USER_AGENT`: 自定义 UA
- `TAPD_STORY_URL_TEMPLATE`: 仅传 ID 时可用，模板中使用 `{id}`

## 失败排查
1. 确认浏览器已登录 TAPD，并以 `--remote-debugging-port=<port>` 启动。
2. 执行 `curl http://127.0.0.1:<port>/json/version` 确认 CDP 可连通。
3. CDP 失败时提供 `TAPD_COOKIE` 后重试，必要时传完整 `--story-url`。
