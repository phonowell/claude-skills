---
name: invoke-opencode-acp
description: 委托任务给 opencode subagent 节省 tokens，use when delegating tasks to opencode
allowed-tools: Bash
---

# invoke-opencode-acp

## 何时使用

**激进策略**：≥2 文件修改/复杂任务优先委托 · 节省主进程 tokens（~6s 开销可接受）

**适用场景**：重构 · 批量操作 · 代码审查 · 多文件修改 · 独立子任务 · 多轮推理 · git 操作（commit/push/PR）

**不适用**：单文件快速修改 · OpenCode 中禁用（避免递归）

**关键**：提供最小必要上下文（目标）· 让 subagent 自主分析（路径/格式/细节）

## 效率优先

`acp_client.py`（本目录）> 手动协议 · `opencode acp` > run/serve（避免 HTTP）

## 协议关键

**流程**：启动 `opencode acp` → initialize（protocolVersion: 1 数字）→ session/new（mcpServers: [] 数组）→ session/prompt（prompt: [] 数组，非 content）→ 监听 session/update

**错误码**：-32001 未找到 · -32002 拒绝 · -32003 状态 · -32004 不支持 · -32601 方法 · -32602 参数

**约束**：持续监听流式更新 · select/非阻塞 IO · 独立 sessionId 并发 · terminate/kill 退出

## 调用方式

**Bash**（推荐）：
```bash
python3 ~/.claude/skills/invoke-opencode-acp/acp_client.py "$PWD" "任务" || echo "✗ 失败"
```

**参数**：`-q` 静默 · `-v` 详细 · `-t 120` 超时（默认120s）· `-o FILE` 输出 · `-m MODEL` 模型（v1.1.4 被忽略）

**超时设置**：根据任务复杂度调整 `-t` 参数，避免超时失败
- 简单任务：120-300s（默认）
- 复杂重构：600-900s  
- 多文件批量：900-1800s
- 建议保守设置，宁可等待也不要超时

**Python**：
```python
from acp_client import ACPClient
output, count = ACPClient(quiet=True).execute_task("/path", "task", timeout=120)
```

**限制**：model_id 预留但当前无效（默认 big-pickle）

## 返回信息

✓ 已完成 subagent 调用
✗ 中断：{原因}（协议错误/超时/进程退出）
