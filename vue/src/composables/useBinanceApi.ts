import { ref } from 'vue';
import CryptoJS from 'crypto-js';

// 签名函数
function sign(query: string, apiSecret: string) {
  return CryptoJS.HmacSHA256(query, apiSecret).toString();
}

// 获取API密钥
function getApiKeys() {
  const API_KEY = import.meta.env.VITE_BINANCE_KEY;
  const API_SECRET = import.meta.env.VITE_BINANCE_SECRET;

  if (!API_KEY || !API_SECRET) {
    throw new Error('API 密钥未配置');
  }

  return { API_KEY, API_SECRET };
}

// 获取 listenKey
export async function getListenKey(): Promise<string> {
  try {
    const { API_KEY } = getApiKeys();
    const url = `/api/v3/userDataStream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.listenKey;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.msg || '获取账户信息失败');
    }
  } catch (error: any) {
    throw error;
  }
}

// 获取账户信息
export async function getAccountInfo() {
  try {
    const { API_KEY, API_SECRET } = getApiKeys();

    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = sign(query, API_SECRET);
    const url = `/api/v3/account?${query}&signature=${signature}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': API_KEY,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.msg || '获取账户信息失败');
    }
  } catch (error: any) {
    throw error;
  }
}

// 下单
export async function placeOrder(params: any) {
  try {
    const { API_KEY, API_SECRET } = getApiKeys();

    const ts = Date.now();
    params.timestamp = ts;
    const query = new URLSearchParams(params).toString();
    const sig = sign(query, API_SECRET);
    const url = `/api/v3/order?${query}&signature=${sig}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.msg || '下单失败', code: data.code };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 获取订单历史
export async function getOrderHistory(symbol: string, limit: number = 20) {
  try {
    const { API_KEY, API_SECRET } = getApiKeys();

    const timestamp = Date.now();
    const query = `symbol=${symbol}&limit=${limit}&timestamp=${timestamp}`;
    const signature = sign(query, API_SECRET);
    const url = `/api/v3/allOrders?${query}&signature=${signature}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': API_KEY,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.msg || '获取订单历史失败');
    }
  } catch (error: any) {
    throw error;
  }
} 