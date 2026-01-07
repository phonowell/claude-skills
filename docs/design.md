# Sync 设计文档

## 核心概念

### 目录定义
- **LOCAL** (`skills`): 项目本地目录
- **REMOTE** (`~/.claude/skills`): Claude 远程目录

### 同步方向
- **pull**: REMOTE → LOCAL (从 Claude 拉取到项目)
- **push**: LOCAL → REMOTE (从项目推送到 Claude)

## 关键 API 语义

### promptAction(local, remote)
提示用户选择同步操作：
- **参数**: 始终传入 `(local, remote)`
- **返回值**: `'local -> remote'` | `'local <- remote'` | `'skip'`
- **选项显示**:
  - `local -> remote (newer, XL -> YL)` - 推送到远程
  - `local <- remote (newer, XL -> YL)` - 从远程拉取
  - 自动标记较新文件并设为默认选项

### overwriteFile(action, local, remote)
执行文件覆盖操作：
- **参数**: 始终传入 `(action, local, remote)`
- **`local -> remote`**: 复制 `local` → `remote`
- **`local <- remote`**: 复制 `remote` → `local`

## 参数映射逻辑

### 场景 1: remote 文件更新 (pull)
```
调用: promptAction(local, remote)
用户选择: 'local <- remote'
执行: overwriteFile('local <- remote', local, remote) → 复制 remote → local ✓
```

### 场景 2: local 文件更新 (push)
```
调用: promptAction(local, remote)
用户选择: 'local -> remote'
执行: overwriteFile('local -> remote', local, remote) → 复制 local → remote ✓
```

## 当前实现逻辑

### 同步流程
1. 收集 local 和 remote 的所有文件（转换为相对路径匹配）
2. 对每对文件执行 `syncFile`
3. `syncFile` 判断文件是否存在/不同，调用 `promptAction`
4. 根据 action 调用 `overwriteFile` 执行复制

### 新增文件处理
- 仅在 local 存在: push (local → remote)
- 仅在 remote 存在: pull (remote → local)

### 差异文件处理
- 检查文件是否相同 (`isSame`)
- 不同则显示 diff 并让用户选择操作
- 支持 skip 跳过

## 设计决策

1. **参数顺序统一**: 所有 API 使用 `(local, remote)` 顺序
2. **移除 diff 显示**: 简化交互，直接显示操作选项
3. **action 语义明确**: 使用箭头符号 `->` / `<-` 表达方向
