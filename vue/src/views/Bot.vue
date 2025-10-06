<template>
  <div class="bot-container">
    <!-- 连接状态 -->
    <ConnectionStatus />

    <!-- 实时数据和配置 -->
    <section class="data-section">
      <div class="data-header">
        <h2>实时数据</h2>
        <div class="refresh-info">最后更新: {{ botStore.lastUpdateTime }}</div>
      </div>

      <div class="data-grid">
        <!-- 左侧：价格信息 -->
        <PriceInfo />

        <!-- 右侧：交易对配置和交易记录 -->
        <div class="right-panel">
          <TradeConfig />
          <TradeLog />
        </div>
      </div>
    </section>

    <!-- 订单历史 -->
    <OrderHistory />

    <!-- 交易统计 -->
    <StatsSummary />

    <!-- 悬浮按钮 -->
    <FloatingButtons />

    <!-- 用户信息 -->
    <UserInfo />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { closeWebSocket } from '@/composables/useWebSocket'
import { useBotStore } from '@/stores/bot'

const botStore = useBotStore()

onMounted(() => {
  // 检查 API 密钥配置
  const API_KEY = import.meta.env.VITE_BINANCE_KEY
  const API_SECRET = import.meta.env.VITE_BINANCE_SECRET

  if (!API_KEY || !API_SECRET) {
    console.warn('请在 .env 文件中配置 VITE_BINANCE_KEY 和 VITE_BINANCE_SECRET')
  }
})

onUnmounted(() => {
  closeWebSocket()
})
</script>

<style lang="scss" scoped>
.bot-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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
    grid-template-columns: 1fr 50%;
    gap: 16px;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
