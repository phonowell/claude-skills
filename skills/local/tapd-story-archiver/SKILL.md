---
name: tapd-story-archiver
description: Archive TAPD story content into a target repository with source metadata, using CDP first and curl fallback. Use this skill whenever the user provides a TAPD story URL or ID, asks to fetch or archive TAPD requirements, wants the original正文 preserved under `docs/requirements`, or needs a traceable TAPD snapshot with reproducible metadata.
allowed-tools: Bash, Read, Write, Edit
---

# TAPD 抓取归档

稳定生成可审计的 TAPD 原文快照，并在失败时给出可执行修复路径。

## 触发边界
- 需要把 TAPD story 正文归档到目标仓库 `docs/requirements`
- 需要保留原始正文与可审计元信息（URL/时间/抓取方式/校验）
- 需要优先复用本机已登录浏览器会话（CDP），失败再走 curl

## 工作流程
1. 优先调用 `scripts/fetch-and-archive.js`，不要重写抓取逻辑
2. 解析 `--repo-path` 与 `--story-id` / `--story-url`，确认输出目录
3. 先走 CDP 复用本机已登录会话；失败时回退 curl
4. 写入 `tapd-<id>-original.md` 与对应 meta，并执行非空/正文/登录页误抓校验
5. 若 `original.md` 已存在且未传 `--overwrite`，保留正文，仅更新 meta
6. 失败时返回非 0，并在 meta 中写入失败原因与修复步骤

## 资源入口
- 默认只调用 `scripts/fetch-and-archive.js`
- 需要确认边界行为时再读该脚本，不要在正文里重述实现细节

## 命令入口
- `pnpm tapd:archive -- --repo-path <repo> --story-url <url>`
- `pnpm tapd:archive -- --repo-path <repo> --story-id <id>`
- `node skills/tapd-story-archiver/scripts/fetch-and-archive.js ...`

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

## 回退与校验
- `original.md` 已存在且未传 `--overwrite` 时默认不覆盖，仅更新 meta
- 自动校验：非空、首个非空行为正文、非登录页、非 403、非重定向误抓
- CDP 失败后再使用以下 curl 环境变量：
- `TAPD_COOKIE`: cookie 字符串
- `TAPD_HEADERS_JSON`: 额外请求头 JSON
- `TAPD_USER_AGENT`: 自定义 UA
- `TAPD_STORY_URL_TEMPLATE`: 仅传 ID 时可用，模板中使用 `{id}`

## 失败排查
1. 确认浏览器已登录 TAPD，并以 `--remote-debugging-port=<port>` 启动。
2. 执行 `curl http://127.0.0.1:<port>/json/version` 确认 CDP 可连通。
3. CDP 失败时提供 `TAPD_COOKIE` 后重试，必要时传完整 `--story-url`。

## 输出契约
- 输入：目标仓库路径、story URL 或 ID、可选 CDP 端口和覆盖策略
- 输出：归档文件路径、使用的抓取方式、校验结果；失败时给出下一步修复动作
- 成功：`✓ TAPD story 已归档`
- 失败：`✗ TAPD 归档失败：{原因}`
