---
name: xiaohongshu-readonly
description: Read-only Xiaohongshu browsing and extraction via the bundled `agent-browser` wrapper. Use this skill whenever the user wants to open, inspect, search, summarize, screenshot, or extract anything from `xiaohongshu.com` without posting or editing, even if they only mention a Xiaohongshu URL, note, profile, search keyword, or want read-only automation on the site.
allowed-tools: Bash, Read
---

# Xiaohongshu Reader

Use this skill for read-only work on `xiaohongshu.com` and its subdomains. Always stay inside the bundled wrapper instead of calling `agent-browser` directly.

## Workflow
- Always use `scripts/agent-browser-readonly.sh`.
- Stay inside `xiaohongshu.com,*.xiaohongshu.com`.
- Prefer direct URLs.
- For search, open Xiaohongshu search-result URLs directly instead of typing into site forms.
- If a page requires login or anti-bot verification, rerun the same command with `--headed` and let the human complete the step manually once. Session data is persisted under `xiaohongshu-readonly`.

## Resources
- Default entry: `scripts/agent-browser-readonly.sh`
- Read the script only when you need to confirm the enforced session, domain, or command restrictions

## Command policy
- Allowed commands: `open` `snapshot` `get` `wait` `scroll` `click` `back` `forward` `reload` `screenshot` `pdf` `tab` `close` `session`
- Forbidden commands: `fill` `type` `keyboard` `upload` `download` `eval` `check` `uncheck` `select` `auth` `cookies` `storage`
- Forbidden flows: any publish, comment, like, follow, collect, edit, or settings flow

## Common commands
```bash
./scripts/agent-browser-readonly.sh open https://www.xiaohongshu.com/
./scripts/agent-browser-readonly.sh open 'https://www.xiaohongshu.com/search_result?keyword=%E5%92%96%E5%95%A1'
./scripts/agent-browser-readonly.sh snapshot -i
./scripts/agent-browser-readonly.sh get text body
./scripts/agent-browser-readonly.sh screenshot --full
./scripts/agent-browser-readonly.sh --headed open https://www.xiaohongshu.com/
```

## Output contract
- Input: Xiaohongshu URL, keyword, note, profile, or read-only extraction target
- Output: requested page state, text, screenshot, or summary without changing site state
- Success: `✓ Xiaohongshu read-only task completed`
- Failure: `✗ Xiaohongshu read-only task failed: {reason}`
