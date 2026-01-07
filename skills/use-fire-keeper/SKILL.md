---
name: use-fire-keeper
description: 指导使用 fire-keeper 库函数替代原生 Node.js API，use when performing file operations, path handling, or concurrent task execution
---

# use-fire-keeper

## 何时使用

脚本任务涉及：文件批量操作 · 路径规范化/项目根路径解析 · 并发执行异步任务（限流） · YAML 配置读取 · 文件监听/压缩/下载 · 交互式命令行提示

## 效率优先

fire-keeper 工具函数 > 原生 Node.js API（fs/path/child_process/os）

## 核心 API

**文件操作**：`copy` · `write` · `read` · `mkdir` · `move` · `remove` · `rename` · `clean` · `stat` · `backup` · `recover` · `download` · `zip` · `watch` · `isExist` · `isSame`

**文件匹配**：`glob(source, options)` → `ListSource`（品牌类型，可缓存，支持 fast-glob 选项）

**日志**：`echo(tag, message)` · `renderPath` · `freeze` · `whisper` · `pause` · `resume`

**并发**：`runConcurrent(concurrency, tasks, { stopOnError? })` → Promise<Result[]>

**路径**：`normalizePath` · `root` · `home` · `getBasename` · `getDirname` · `getExtname` · `getFilename` · `getName`

**工具**：`argv` · `prompt` · `wrapList` · `toArray` · `at` · `findIndex` · `flatten` · `trimEnd` · `exec` · `run` · `sleep` · `os` · `toDate`

## 路径处理原则

**自动前缀处理**：所有 fire-keeper API（glob/copy/read/write/isSame 等）自动处理路径前缀
- `./file` → 项目根路径
- `~/file` → 用户主目录
- **禁止**：显式调用 `normalizePath('./file')` 或 `join(root(), 'file')`，直接传 `./file` 即可

**路径拼接**：模板字符串 + 前缀
- ✅ `\`./skills/${name}\`` → 项目根相对路径
- ✅ `\`~/.claude/${name}\`` → 主目录相对路径
- ❌ `join(root(), 'skills', name)` → root() 仅返回基础路径，不支持多参数

**辅助函数**：仅用于获取基础路径或元信息
- `root()` → 项目根绝对路径（单次使用）
- `home()` → 用户主目录（单次使用）
- `getName(path)` → 提取 basename/dirname/extname

## 快速查找

**读文件**：`read(path)` → YAML/JSON 自动解析，文本返回 string，`raw: true` 返回 Buffer
**写文件**：`write(content, path)` → 自动创建目录
**批量处理**：`glob(source)` → `ListSource` → `runConcurrent(5, tasks)`
**交互提示**：`prompt({ type, message, ... })` → text/confirm/number/select/multi/toggle
**执行命令**：`exec(cmd)` → `[exitCode, lastOutput, allOutputs]`（跨平台）
**日志输出**：`echo(tag, message)` → 路径自动简化（`.` 项目根，`~` 主目录），`**xxx**` 洋红高亮

## 关键约束

- `glob` 返回 `ListSource` 品牌类型（`__IS_LISTED_AS_SOURCE__: true`），可缓存重用
- `echo` 无匹配时提示 + 早返回（**禁 throw**）
- `runConcurrent` 默认并发 5，默认收集所有错误抛出 AggregateError
- `watch` chokidar v4+ 不支持 glob
- `copy` 同目录自动加 `.copy`
- `remove` 支持 glob，默认并发 5
- `backup`/`recover` 生成/恢复 `.bak`，默认并发 5

## 辅助文档

- **reference.md**：API 详细参数和替代规则
- **examples.md**：典型使用模板
