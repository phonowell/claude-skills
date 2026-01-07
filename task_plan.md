# 任务计划：if-return 优化

## 目标
循环复盘优化 src/ 代码，用 if-return 扁平化嵌套结构

## 阶段
1. 第1轮：优化 collectAllFiles 函数（if-return 展平循环嵌套）
2. 第2轮：优化 syncFile 函数（if-return 扁平化多分支）
3. 第3轮：优化 main 函数（检查是否需要优化）
4. 第4轮：全局复盘验证

## 待优化文件
- src/index.ts（3个函数）
- src/index.test.ts（已检查，无嵌套，保持）

## 技术方案
- 提前返回：`if (condition) return` 替代嵌套
- 嵌套展平：减少缩进层级
- 每轮：Edit → `pnpm lint` → `pnpm task test` → 更新状态

## 风险点
- 无（纯重构，逻辑不变）

## 状态
- ✓ 第1轮：collectAllFiles（if-return 展平循环嵌套）
- ✓ 第2轮：syncFile（if-return 扁平化多分支）
- ✓ 第3轮：main（无嵌套，跳过）
- ✓ 第4轮：全局验证（lint ✓ test ✓）

## 错误/决策
（无）
