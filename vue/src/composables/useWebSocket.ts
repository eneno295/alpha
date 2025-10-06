import { ref } from 'vue';
import { getListenKey } from './useBinanceApi';

// WebSocket 状态
export const wsStatus = ref({
  isConnected: false,
  lastError: null as string | null,
});

// WebSocket 连接实例
let wsDepth: WebSocket | null = null;
let wsTrade: WebSocket | null = null;
let wsUser: WebSocket | null = null;

// WebSocket 配置
const WS_CONFIG = {
  // 行情数据流（主网）
  MARKET: {
    BASE_URL: 'wss://stream.binance.com:9443/ws',
    DEPTH_STREAM: '@depth10@1000ms',
    TRADE_STREAM: '@trade',
  },
  // 用户数据流（测试网）
  USER: {
    BASE_URL: 'wss://stream.testnet.binance.vision/ws',
  },
};

// 处理订单簿数据
function handleDepthData(data: any, updateMarketData?: (data: any) => void) {
  if (!updateMarketData) return;

  const bids = data.bids.slice(0, 6).map(([price, quantity]: [string, string]) => ({
    price,
    quantity,
  }));
  const asks = data.asks.slice(0, 6).map(([price, quantity]: [string, string]) => ({
    price,
    quantity,
  }));
  const bestBid = bids[0]?.price || '0';
  const bestAsk = asks[0]?.price || '0';

  updateMarketData({
    bids,
    asks,
    bestBid,
    bestAsk,
  });
}

// 处理交易数据
function handleTradeData(data: any, updateMarketData?: (data: any) => void) {
  if (!updateMarketData) return;

  updateMarketData({
    lastPrice: data.p,
  });
}

// 处理用户数据
function handleUserData(data: any, updateUserData?: (data: any) => void) {
  console.log('👤 用户事件:', data);

  if (updateUserData) {
    updateUserData(data);
  }
}

// 连接深度数据流
function connectDepthStream(symbol: string, updateMarketData?: (data: any) => void) {
  const symbolLower = symbol.toLowerCase();
  const url = `${WS_CONFIG.MARKET.BASE_URL}/${symbolLower}${WS_CONFIG.MARKET.DEPTH_STREAM}`;

  wsDepth = new WebSocket(url);

  wsDepth.onopen = () => {
    wsStatus.value.isConnected = true;
    wsStatus.value.lastError = null;
    console.log('📊 深度数据流已连接');
  };

  wsDepth.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleDepthData(data, updateMarketData);
    } catch (error) {
      console.error('深度数据解析错误:', error);
    }
  };

  wsDepth.onerror = (error) => {
    wsStatus.value.lastError = 'WebSocket depth 连接错误';
    console.error('深度数据流错误:', error);
  };

  wsDepth.onclose = () => {
    console.log('📊 深度数据流关闭');
  };
}

// 连接交易数据流
function connectTradeStream(symbol: string, updateMarketData?: (data: any) => void) {
  const symbolLower = symbol.toLowerCase();
  const url = `${WS_CONFIG.MARKET.BASE_URL}/${symbolLower}${WS_CONFIG.MARKET.TRADE_STREAM}`;

  wsTrade = new WebSocket(url);

  wsTrade.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleTradeData(data, updateMarketData);
    } catch (error) {
      console.error('交易数据解析错误:', error);
    }
  };

  wsTrade.onerror = (error) => {
    wsStatus.value.lastError = 'WebSocket trade 连接错误';
    console.error('交易数据流错误:', error);
  };

  wsTrade.onclose = () => {
    console.log('📈 交易数据流关闭');
  };
}

// 连接用户数据流
async function connectUserStream(updateUserData?: (data: any) => void) {
  try {
    const listenKey = await getListenKey();
    const url = `${WS_CONFIG.USER.BASE_URL}/${listenKey}`;

    wsUser = new WebSocket(url);

    wsUser.onopen = () => {
      console.log('👤 用户数据流已连接');
    };

    wsUser.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleUserData(data, updateUserData);
      } catch (error) {
        console.error('用户数据解析错误:', error);
      }
    };

    wsUser.onclose = () => {
      console.log('👤 用户数据流关闭');
    };

    wsUser.onerror = (error) => {
      wsStatus.value.lastError = 'WebSocket userData 连接错误';
      console.error('用户数据流错误:', error);
    };
  } catch (error) {
    console.error('获取 listenKey 失败:', error);
    wsStatus.value.lastError = '获取 listenKey 失败';
  }
}

// 建立 WebSocket 连接
export async function connectWebSocket(symbol: string, updateMarketData?: (data: any) => void, updateUserData?: (data: any) => void) {
  console.log('🔌 开始连接 WebSocket...');

  // 连接行情数据流
  connectDepthStream(symbol, updateMarketData);
  connectTradeStream(symbol, updateMarketData);

  // 连接用户数据流
  await connectUserStream(updateUserData);

  console.log('✅ WebSocket 连接完成');
}

// 关闭单个 WebSocket 连接
function closeSingleWebSocket(ws: WebSocket | null, name: string) {
  if (ws) {
    console.log(`🔌 关闭 ${name} 连接`);
    ws.close();
  }
}

// 关闭所有 WebSocket 连接
export async function closeWebSocket() {
  console.log('🔌 开始关闭所有 WebSocket 连接...');

  closeSingleWebSocket(wsDepth, '深度数据流');
  closeSingleWebSocket(wsTrade, '交易数据流');
  closeSingleWebSocket(wsUser, '用户数据流');

  // 重置连接状态
  wsDepth = null;
  wsTrade = null;
  wsUser = null;
  wsStatus.value.isConnected = false;

  console.log('✅ 所有 WebSocket 连接已关闭');
}

// 重新连接 WebSocket
export async function reconnectWebSocket(symbol: string, updateMarketData?: (data: any) => void, updateUserData?: (data: any) => void) {
  console.log('🔄 开始重新连接 WebSocket...');

  await closeWebSocket();
  await connectWebSocket(symbol, updateMarketData, updateUserData);

  console.log('✅ WebSocket 重新连接完成');
} 