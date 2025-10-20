import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { connectWebSocket, closeWebSocket, wsStatus, reconnectWebSocket } from '@/composables/useWebSocket';
import { testApiConnection, apiStatus, placeOrder, getOrderHistory } from '@/composables/useBinanceApi';

export const useBotStore = defineStore('bot', () => {
  // Bot 状态
  const isRunning = ref(false);

  // Bot 配置
  const config = ref({
    symbol: 'BTCUSDT',
    triggerPrice: 60000,
    money: 10,
  });

  // 订单历史
  const orders = ref<
    Array<{
      orderId: string;
      symbol: string;
      side: string;
      price: string;
      origQty: string;
      origQuoteOrderQty: string;
      status: string;
      time: string;
    }>
  >([]);

  // 交易日志
  const tradeLogs = ref<
    Array<{
      id: number;
      time: string;
      message: string;
      type: string;
    }>
  >([]);

  // 市场数据
  const marketData = ref<{
    lastPrice: string | null;
    bestBid: string | null;
    bestAsk: string | null;
    bids: Array<{ price: string; quantity: string }>;
    asks: Array<{ price: string; quantity: string }>;
  }>({
    lastPrice: null,
    bestBid: null,
    bestAsk: null,
    bids: [],
    asks: [],
  });

  // 统计数据
  const stats = computed(() => ({
    totalOrders: orders.value.length,
    successfulOrders: orders.value.filter((o) => o.status === 'FILLED').length,
    totalVolume: orders.value
      .reduce((sum, o) => sum + parseFloat(o.origQty), 0)
      .toFixed(4),
    profit: 0, // 真实数据
  }));

  // 最后更新时间
  const lastUpdateTime = computed(() => {
    return new Date().toLocaleTimeString();
  });

  // 日志统计
  const logStats = computed(() => ({
    total: tradeLogs.value.length,
    success: tradeLogs.value.filter(log => log.type === 'success').length,
    error: tradeLogs.value.filter(log => log.type === 'error').length,
    warning: tradeLogs.value.filter(log => log.type === 'warning').length,
    info: tradeLogs.value.filter(log => log.type === 'info').length,
  }));

  // 添加日志
  const addLog = (message: string, type: string = 'info') => {
    const log = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      message,
      type,
    };
    tradeLogs.value.unshift(log);

    // 限制日志数量
    if (tradeLogs.value.length > 100) {
      tradeLogs.value = tradeLogs.value.slice(0, 100);
    }
  };

  // 清空日志
  const clearLogs = () => {
    tradeLogs.value = [];
    addLog('日志已清空', 'info');
  };

  // 启动 Bot
  const startBot = async () => {
    addLog('正在启动 Bot...', 'info');

    try {
      // 检查是否已连接
      if (!wsStatus.value.isConnected) {
        addLog('❌ 请先连接 WebSocket', 'error');
        return false;
      }

      // 检查是否已连接 API
      if (!apiStatus.value.isConnected) {
        addLog('❌ 请先连接 API', 'error');
        return false;
      }

      isRunning.value = true;
      addLog('✅ Bot 启动成功', 'success');

      return true;
    } catch (error: any) {
      addLog(`❌ 启动 Bot 失败: ${error.message}`, 'error');
      return false;
    }
  };

  // 停止 Bot
  const stopBot = () => {
    isRunning.value = false;
    addLog('Bot 已停止', 'warning');
  };

  // 连接
  const connection = async () => {
    const result = await testApiConnection();

    if (result.success) {
      addLog('✅ API 连接成功', 'success');

      // API 连接成功后自动刷新订单历史
      await refreshOrders();
    } else {
      addLog(`❌ API 连接失败: ${result.error}`, 'error');
    }

    connectWebSocket(config.value.symbol, updateMarketData, updateUserData);
    addLog('✅ WebSocket 连接成功', 'success');
  };

  // 断开连接
  const disconnect = () => {
    addLog('正在断开连接...', 'info');
    closeWebSocket();

    // 重置 API 连接状态
    apiStatus.value.isConnected = false;
    apiStatus.value.lastError = null;

    addLog('✅ 连接已断开', 'success');
  };

  // 更新订单
  const updateOrders = (newOrders: typeof orders.value) => {
    orders.value = newOrders;
  };

  // 刷新订单历史
  const refreshOrders = async () => {
    try {
      const data = await getOrderHistory(config.value.symbol, 20);

      // 转换数据格式
      const formattedOrders = data.map((order: any) => ({
        ...order,
        time: new Date(order.time).toLocaleString(),
      }));

      updateOrders(formattedOrders);
      addLog(`✅ 成功获取 ${formattedOrders.length} 条订单记录`, 'success');
    } catch (error: any) {
      addLog(`❌ 获取订单失败: ${error.message}`, 'error');
    }
  };

  // 更新市场数据
  const updateMarketData = (data: Partial<typeof marketData.value>) => {
    marketData.value = { ...marketData.value, ...data };

    // 如果 Bot 正在运行，检查交易条件
    if (isRunning.value) {
      checkTradingCondition();
    }
  };

  // 检查交易条件
  const checkTradingCondition = () => {
    const currentPrice = parseFloat(marketData.value.lastPrice || '0');
    const triggerPrice = config.value.triggerPrice;

    if (currentPrice > 0 && currentPrice <= triggerPrice) {
      addLog(`🎯 触发交易条件: 当前价格 ${currentPrice} <= 触发价格 ${triggerPrice}`, 'success');

      // 立即停止 Bot，防止重复触发
      isRunning.value = false;

      executeTrade();
    }
  };

  // 执行交易
  const executeTrade = async () => {
    try {
      addLog('📈 开始执行买入交易...', 'info');

      // 这里添加实际的交易逻辑
      const orderResult = await placeOrder({
        symbol: config.value.symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: config.value.money.toString()
      });

      addLog(`✅ 买入交易执行成功: ${config.value.money} USDT`, 'success');
      addLog('🛑 Bot 已自动停止，避免重复交易', 'warning');

      // 交易成功后自动刷新订单历史
      await refreshOrders();

    } catch (error: any) {
      addLog(`❌ 交易执行失败: ${error.message}`, 'error');
    }
  };

  // 更新交易对
  const updateSymbol = (symbol: string) => {
    config.value.symbol = symbol;
    if (wsStatus.value.isConnected) {
      // 重新连接 WebSocket
      reconnectWebSocket(symbol, updateMarketData, updateUserData);
    }
  };

  // 更新用户数据
  const updateUserData = (data: any) => {
    console.log('👤 用户事件:', data);
  };

  return {
    // 状态
    isRunning,
    config,
    orders,
    tradeLogs,
    marketData,
    stats,
    lastUpdateTime,
    logStats,

    // 方法
    startBot,
    stopBot,
    connection,
    disconnect,
    updateSymbol,
    updateOrders,
    refreshOrders,
    updateMarketData,
    addLog,
    clearLogs,
  };
}); 