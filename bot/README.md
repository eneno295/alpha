# Bot Vue 项目

这是一个基于 Vue 3 + TypeScript 的 Binance 交易机器人管理界面。

## 功能特性

- 📊 实时价格监控
- 🤖 自动交易策略
- 📈 订单历史管理
- 📝 交易日志记录
- ⚙️ 灵活配置管理

## 安装依赖

```bash
npm install
```

## 配置 API 密钥

1. 在项目根目录创建 `.env` 文件
2. 添加以下配置：

```env
# Binance API 配置
VITE_BINANCE_KEY=your_binance_api_key_here
VITE_BINANCE_SECRET=your_binance_api_secret_here

# 默认交易对
VITE_DEFAULT_SYMBOL=BTCUSDT
```

## 启动开发服务器

```bash
npm run dev
```

## 构建生产版本

```bash
npm run build
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- SCSS
- WebSocket
- Binance API

## 注意事项

- 请确保 API 密钥的安全性
- 建议在测试网环境下进行测试
- 交易有风险，请谨慎操作
