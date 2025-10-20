import axios from "axios";
import crypto from "crypto";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.BINANCE_KEY;
const API_SECRET = process.env.BINANCE_SECRET;
const SYMBOL = process.env.SYMBOL || "BTCUSDT";

// ✅ REST 下单 → Testnet
const REST_BASE = "https://testnet.binance.vision";

// ✅ 行情订阅 → Mainnet
const WS_BASE = "wss://stream.binance.com:9443/ws";

function sign(query) {
  return crypto.createHmac("sha256", API_SECRET).update(query).digest("hex");
}

// 下单函数 (走 Testnet)
async function newOrder(params) {
  const ts = Date.now();
  params.timestamp = ts;
  const query = new URLSearchParams(params).toString();
  const sig = sign(query);
  const url = `${REST_BASE}/api/v3/order?${query}&signature=${sig}`;

  try {
    const { data } = await axios.post(url, null, {
      headers: { "X-MBX-APIKEY": API_KEY },
    });
    console.log("✅ 下单成功:", data);
    return data;
  } catch (err) {
    console.error("❌ 下单失败:", err.response?.data || err.message);
  }
}

// ======================
// 📡 建立两个 WS 连接
// ======================

// 1️⃣ bookTicker（买一/卖一）
const wsBook = new WebSocket(`${WS_BASE}/${SYMBOL.toLowerCase()}@bookTicker`);

// 2️⃣ trade（最新成交）
const wsTrade = new WebSocket(`${WS_BASE}/${SYMBOL.toLowerCase()}@trade`);

let bestBid = null;
let bestAsk = null;
let lastPrice = null;

let lastLog = 0;

wsBook.on("message", (msg) => {
  const data = JSON.parse(msg);
  bestBid = parseFloat(data.b);
  bestAsk = parseFloat(data.a);
});

wsTrade.on("message", (msg) => {
  const data = JSON.parse(msg);
  lastPrice = parseFloat(data.p);

  // 每秒打印一次
  const now = Date.now();
  if (now - lastLog > 1000) {
    console.log(
      `📊 ${SYMBOL} Bid=${bestBid} | Ask=${bestAsk} | Last=${lastPrice}`
    );
    lastLog = now;
  }

  // 策略示例：当 Ask < 60000，挂一个限价买单
  if (bestAsk && bestAsk < 111400) {
    const qty = (10 / bestAsk).toFixed(4);
    newOrder({
      symbol: SYMBOL,
      side: "BUY",
      type: "LIMIT",
      timeInForce: "GTC",
      price: bestAsk,
      quantity: qty,
    });
    wsBook.close();
    wsTrade.close();
  }
});
