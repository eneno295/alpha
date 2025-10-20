<template>
  <div class="data-card">
    <div class="header">
      <h3>价格信息</h3>
      <!-- 最新价格 -->
      <div class="last">
        最新价:
        {{ formatNumber(botStore.marketData.lastPrice) || '--' }}
      </div>
    </div>
    <div class="price-info">
      <!-- 卖价列表 -->
      <div class="price-section asks">
        <div class="section-title">卖价</div>
        <div
          class="price-item ask"
          v-for="(ask, index) in [...botStore.marketData.asks].reverse()"
          :key="`ask-${index}`"
        >
          <span class="price-label">卖{{ 6 - index }}</span>
          <span class="price-value ask">{{ formatNumber(ask.price) }}</span>
          <span class="quantity">{{ formatNumber(ask.quantity) }}</span>
        </div>
      </div>

      <!-- 中间分隔行 -->
      <div class="price-separator">
        <span class="spread-info">
          {{ formatNumber(botStore.marketData.bestBid) || '--' }} ↓
          {{ formatNumber(botStore.marketData.bestAsk) || '--' }}
        </span>
      </div>

      <!-- 买价列表 -->
      <div class="price-section bids">
        <div class="section-title">买价</div>
        <div
          class="price-item bid"
          v-for="(bid, index) in botStore.marketData.bids"
          :key="`bid-${index}`"
        >
          <span class="price-label">买{{ index + 1 }}</span>
          <span class="price-value bid">{{ formatNumber(bid.price) }}</span>
          <span class="quantity">{{ formatNumber(bid.quantity) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '@/stores/bot';

const botStore = useBotStore();

// 格式化数字，去除无用的0
const formatNumber = (price: string | null) => {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return price;

  return num.toString();
};
</script>

<style lang="scss" scoped>
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
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
    font-size: 13px;

    .price-label {
      font-size: 12px;
      color: var(--text-muted);
      min-width: 40px;
    }

    .price-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
      text-align: center;

      &.bid {
        color: var(--success);
      }

      &.ask {
        color: var(--error);
      }
    }

    .quantity {
      font-size: 11px;
      color: var(--text-muted);
      min-width: 60px;
      text-align: right;
    }

    &.ask {
      background: rgba(239, 68, 68, 0.05);
      border-left: 3px solid var(--error);
    }

    &.bid {
      background: rgba(34, 197, 94, 0.05);
      border-left: 3px solid var(--success);
    }
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    .last {
      background: var(--bg-secondary);
      padding: 10px 12px;
      font-size: 14px;
    }
  }

  .price-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
      padding: 0 4px;
    }
  }

  .price-separator {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6px;
    margin: 8px 0;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 4px;
    border: 1px solid var(--success);

    .spread-info {
      font-size: 12px;
      font-weight: 600;
      color: var(--success);
      text-align: center;
    }
  }
}
</style>
