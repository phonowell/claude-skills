# Examples: Planning with Files in Action

## task_plan.md Template {#task_plan-template}

```markdown
# Task Plan: [简述]

## Goal
[一句话目标]

## Phases
- [ ] Phase 1: Plan and setup
- [ ] Phase 2: Research/gather information
- [ ] Phase 3: Execute/build
- [ ] Phase 4: Review and deliver

## Key Questions
1. [问题]

## Decisions Made
- [决策]: [理由]

## Errors Encountered
- [错误]: [解决方案]

## Status
**Currently in Phase X** - [当前工作]
```

## Example 1: Research Task

**请求**：研究晨练益处并写总结

**循环 1（创建）**：Write task_plan.md（Goal: 晨练总结 · Phases: 4阶段 · Questions: 物理/心理益处/研究支持）

**循环 2（研究）**：Read task_plan.md → WebSearch → Write notes.md → Edit task_plan.md（标 Phase 2 ✓）

**循环 3（综合）**：Read task_plan.md → Read notes.md → Write summary.md → Edit task_plan.md（标 Phase 3 ✓）

**循环 4（交付）**：Read task_plan.md → Deliver summary.md

## Example 2: Bug Fix

**请求**：修复登录 bug

**task_plan.md 快照**：
```markdown
## Phases
- [x] Phase 1: 理解报告 ✓
- [x] Phase 2: 定位代码 ✓
- [ ] Phase 3: 找根因（当前）

## Decisions Made
- 处理器：src/auth/login.ts
- 错误位置：validateToken()

## Errors Encountered
- TypeError: token undefined → user 对象未 await
```

## Example 3: Feature Development

**请求**：添加暗色模式切换

**task_plan.md 快照**：
```markdown
## Phases
- [x] Phase 1: 研究主题系统 ✓
- [ ] Phase 3: 实现切换组件（当前）

## Decisions Made
- CSS 自定义属性 · localStorage 存储 · SettingsPage.tsx 放置
```

**notes.md**：
```markdown
## 现有主题系统
位置：src/styles/theme.ts · 使用：CSS custom properties · 当前：仅 light

## 修改文件
1. src/styles/theme.ts - 添加暗色
2. src/components/SettingsPage.tsx - 添加切换
3. src/hooks/useTheme.ts - 新建 hook
4. src/App.tsx - ThemeProvider 包裹
```

**deliverable**（完成时）：`dark_mode_implementation.md` 记录变更文件和关键代码

## 错误恢复模式

**错误**：Read config.json → File not found

**✗ 错误**：静默重试 Read config.json（隐藏错误）

**✓ 正确**：
1. Edit task_plan.md 写入 Errors Encountered：`config.json 缺失 → 创建默认配置`
2. Write config.json（默认配置）
3. Read config.json → Success

## Read-Before-Decide 模式

**示例**：50+ 工具调用后 → Read task_plan.md → 决策时目标在上下文窗口（详见 [reference.md](reference.md#2-重复读取操控注意力)）
