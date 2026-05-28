# 终端数独

纯 Node.js，无第三方依赖。在命令行里玩 9×9 数独。

## 运行

```bash
cd games/sudoku
node index.js
```

或：

```bash
npm start
```

## 难度

```bash
node index.js easy      # 简单
node index.js medium    # 中等
node index.js hard      # 困难
```

## 操作

| 按键 | 作用 |
|------|------|
| ↑ ↓ ← → | 移动光标 |
| 1～9 | 填入数字 |
| 0 / Backspace | 清除当前格 |
| h | 提示（填当前格正确答案） |
| n | 新开一局 |
| q | 退出 |

## 说明

- 灰色粗体为题目给定数字，不能改。
- 填错会与行/列/宫冲突时显示为红色。
- 完成后会提示过关。
