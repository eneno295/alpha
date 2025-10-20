<template>
  <div class="bot-container">
    <!-- 头部统计卡片 -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-value">{{ botStats.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ botStats.successfulOrders }}</div>
          <div class="stat-label">成功订单</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ botStats.totalVolume }}</div>
          <div class="stat-label">交易量</div>
        </div>
        <div class="stat-card">
          <div
            class="stat-value"
            :class="{
              positive: botStats.profit > 0,
              negative: botStats.profit < 0,
            }"
          >
            {{ botStats.profit > 0 ? '+' : '' }}{{ botStats.profit }}
          </div>
          <div class="stat-label">总收益</div>
        </div>
      </div>
    </section>

    <!-- Bot 控制面板 -->
    <section class="control-section">
      <div class="control-header">
        <h2>Bot 控制面板</h2>
        <div class="status-indicator" :class="{ active: botStatus.isRunning }">
          {{ botStatus.isRunning ? '运行中' : '已停止' }}
        </div>
      </div>

      <div class="control-grid">
        <!-- 连接状态 -->
        <div class="control-card">
          <h3>连接状态</h3>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">WebSocket 连接</span>
              <span
                class="status-value"
                :class="{ connected: botStatus.wsConnected }"
              >
                {{ botStatus.wsConnected ? '已连接' : '未连接' }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">API 连接</span>
              <span
                class="status-value"
                :class="{ connected: botStatus.apiConnected }"
              >
                {{ botStatus.apiConnected ? '已连接' : '未连接' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 交易对配置 -->
        <div class="control-card">
          <h3>交易对配置</h3>
          <div class="config-form">
            <div class="form-group">
              <label>交易对</label>
              <select
                v-model="botConfig.symbol"
                :disabled="botStatus.isRunning"
              >
                <option value="BTCUSDT">BTCUSDT</option>
                <option value="ETHUSDT">ETHUSDT</option>
                <option value="BNBUSDT">BNBUSDT</option>
                <option value="ADAUSDT">ADAUSDT</option>
              </select>
            </div>
            <div class="form-group">
              <label>触发价格</label>
              <input
                type="number"
                v-model="botConfig.triggerPrice"
                :disabled="botStatus.isRunning"
                placeholder="输入触发价格"
              />
            </div>
            <div class="form-group">
              <label>交易数量 (USDT)</label>
              <input
                type="number"
                v-model="botConfig.quantity"
                :disabled="botStatus.isRunning"
                placeholder="输入交易数量"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="control-card">
          <h3>操作控制</h3>
          <div class="button-group">
            <button
              class="btn-start"
              @click="startBot"
              :disabled="botStatus.isRunning"
            >
              启动 Bot
            </button>
            <button
              class="btn-stop"
              @click="stopBot"
              :disabled="!botStatus.isRunning"
            >
              停止 Bot
            </button>
            <button class="btn-test" @click="testConnection">测试连接</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 实时数据 -->
    <section class="data-section">
      <div class="data-header">
        <h2>实时数据</h2>
        <div class="refresh-info">最后更新: {{ lastUpdateTime }}</div>
      </div>

      <div class="data-grid">
        <div class="data-card">
          <h3>价格信息</h3>
          <div class="price-info">
            <div class="price-item">
              <span class="price-label">最新价格</span>
              <span class="price-value">{{
                marketData.lastPrice || '--'
              }}</span>
            </div>
            <div class="price-item">
              <span class="price-label">买一价</span>
              <span class="price-value bid">{{
                marketData.bestBid || '--'
              }}</span>
            </div>
            <div class="price-item">
              <span class="price-label">卖一价</span>
              <span class="price-value ask">{{
                marketData.bestAsk || '--'
              }}</span>
            </div>
          </div>
        </div>

        <div class="data-card">
          <h3>交易记录</h3>
          <div class="trade-log">
            <div
              v-for="log in tradeLogs"
              :key="log.id"
              class="log-item"
              :class="log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 订单历史 -->
    <section class="orders-section">
      <div class="orders-header">
        <h2>订单历史</h2>
        <button class="btn-refresh" @click="refreshOrders">刷新</button>
      </div>

      <div class="orders-table">
        <table>
          <thead>
            <tr>
              <th>订单ID</th>
              <th>交易对</th>
              <th>方向</th>
              <th>价格</th>
              <th>数量</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.orderId">
              <td>{{ order.orderId }}</td>
              <td>{{ order.symbol }}</td>
              <td :class="order.side.toLowerCase()">{{ order.side }}</td>
              <td>{{ order.price }}</td>
              <td>{{ order.quantity }}</td>
              <td :class="order.status.toLowerCase()">{{ order.status }}</td>
              <td>{{ order.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Bot 状态
const botStatus = ref({
  isRunning: false,
  wsConnected: false,
  apiConnected: false,
});

// Bot 配置
const botConfig = ref({
  symbol: 'BTCUSDT',
  triggerPrice: 60000,
  quantity: 10,
});

// 市场数据
const marketData = ref<{
  lastPrice: string | null;
  bestBid: string | null;
  bestAsk: string | null;
}>({
  lastPrice: null,
  bestBid: null,
  bestAsk: null,
});

// 交易日志
const tradeLogs = ref([
  { id: 1, time: '14:30:25', message: 'Bot 启动成功', type: 'info' },
  { id: 2, time: '14:30:26', message: 'WebSocket 连接建立', type: 'success' },
  { id: 3, time: '14:30:27', message: '监听 BTCUSDT 价格变化', type: 'info' },
]);

// 订单历史
const orders = ref([
  {
    orderId: '123456789',
    symbol: 'BTCUSDT',
    side: 'BUY',
    price: '60000.00',
    quantity: '0.001',
    status: 'FILLED',
    time: '2024-01-15 14:30:25',
  },
]);

// 统计数据
const botStats = computed(() => ({
  totalOrders: orders.value.length,
  successfulOrders: orders.value.filter((o) => o.status === 'FILLED').length,
  totalVolume: orders.value
    .reduce((sum, o) => sum + parseFloat(o.quantity), 0)
    .toFixed(4),
  profit: 0.05, // 示例数据
}));

// 最后更新时间
const lastUpdateTime = computed(() => {
  return new Date().toLocaleTimeString();
});

// 启动 Bot
const startBot = () => {
  botStatus.value.isRunning = true;
  botStatus.value.wsConnected = true;
  addLog('Bot 启动成功', 'success');
};

// 停止 Bot
const stopBot = () => {
  botStatus.value.isRunning = false;
  botStatus.value.wsConnected = false;
  addLog('Bot 已停止', 'warning');
};

// 测试连接
const testConnection = () => {
  botStatus.value.apiConnected = true;
  addLog('API 连接测试成功', 'success');
};

// 刷新订单
const refreshOrders = () => {
  addLog('订单数据已刷新', 'info');
};

// 添加日志
const addLog = (message: string, type: string) => {
  const id = Date.now();
  const time = new Date().toLocaleTimeString();
  tradeLogs.value.unshift({ id, time, message, type });

  // 保持最多 50 条日志
  if (tradeLogs.value.length > 50) {
    tradeLogs.value = tradeLogs.value.slice(0, 50);
  }
};

// 模拟 WebSocket 数据更新
let wsInterval: number | undefined;

onMounted(() => {
  // 模拟实时价格更新
  wsInterval = setInterval(() => {
    if (botStatus.value.isRunning) {
      const basePrice = 60000;
      const variation = (Math.random() - 0.5) * 1000;
      const newPrice = basePrice + variation;

      marketData.value = {
        lastPrice: newPrice.toFixed(2),
        bestBid: (newPrice - 0.5).toFixed(2),
        bestAsk: (newPrice + 0.5).toFixed(2),
      };

      // 检查触发条件
      if (newPrice < botConfig.value.triggerPrice) {
        addLog(
          `价格 ${newPrice.toFixed(2)} 低于触发价格 ${
            botConfig.value.triggerPrice
          }，准备下单`,
          'warning'
        );
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (wsInterval) {
    clearInterval(wsInterval);
  }
});
</script>

<style lang="scss" scoped>
.bot-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;

  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    text-align: center;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;

      &.positive {
        color: var(--success);
      }

      &.negative {
        color: var(--error);
      }
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-muted);
    }
  }
}

/* 控制面板 */
.control-section {
  margin-bottom: 24px;

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .status-indicator {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background: var(--error);
      color: white;

      &.active {
        background: var(--success);
      }
    }
  }

  .control-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }

  .control-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .status-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-label {
        font-size: 14px;
        color: var(--text-muted);
      }

      .status-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--error);

        &.connected {
          color: var(--success);
        }
      }
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }

      input,
      select {
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 14px;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .button-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.btn-start {
        background: var(--success);
        color: white;

        &:hover:not(:disabled) {
          background: #059669;
        }
      }

      &.btn-stop {
        background: var(--error);
        color: white;

        &:hover:not(:disabled) {
          background: #dc2626;
        }
      }

      &.btn-test {
        background: var(--warning);
        color: white;

        &:hover:not(:disabled) {
          background: #d97706;
        }
      }
    }
  }
}

/* 实时数据 */
.data-section {
  margin-bottom: 24px;

  .data-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .refresh-info {
      font-size: 14px;
      color: var(--text-muted);
    }
  }

  .data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;
  }

  .data-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .price-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .price-item {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price-label {
        font-size: 14px;
        color: var(--text-muted);
      }

      .price-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);

        &.bid {
          color: var(--success);
        }

        &.ask {
          color: var(--error);
        }
      }
    }

    .trade-log {
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .log-item {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      display: flex;
      gap: 12px;

      .log-time {
        color: var(--text-muted);
        font-size: 12px;
        min-width: 60px;
      }

      .log-message {
        color: var(--text-primary);
      }

      &.info {
        background: var(--bg-secondary);
      }

      &.success {
        background: rgba(34, 197, 94, 0.1);
        color: var(--success);
      }

      &.warning {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }

      &.error {
        background: rgba(239, 68, 68, 0.1);
        color: var(--error);
      }
    }
  }
}

/* 订单历史 */
.orders-section {
  .orders-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-refresh {
      padding: 8px 16px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: #2563eb;
      }
    }
  }

  .orders-table {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;

    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        background: var(--bg-secondary);
        font-weight: 600;
        color: var(--text-primary);
        font-size: 14px;
      }

      td {
        font-size: 14px;
        color: var(--text-primary);

        &.buy {
          color: var(--success);
        }

        &.sell {
          color: var(--error);
        }

        &.filled {
          color: var(--success);
        }

        &.pending {
          color: var(--warning);
        }

        &.cancelled {
          color: var(--error);
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bot-container {
    padding: 16px;
  }

  .control-grid {
    grid-template-columns: 1fr;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }

  .orders-table {
    overflow-x: auto;

    table {
      min-width: 600px;
    }
  }
}
</style>
