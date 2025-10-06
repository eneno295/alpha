<template>
  <section class="stats-summary">
    <h2>交易统计</h2>
    <div class="summary-content">
      <div class="summary-item">
        <span class="label">总订单数：</span>
        <span class="value">{{ botStore.stats.totalOrders }}</span>
      </div>
      <div class="summary-item">
        <span class="label">成功订单：</span>
        <span class="value">{{ botStore.stats.successfulOrders }}</span>
      </div>
      <div class="summary-item">
        <span class="label">交易量：</span>
        <span class="value">{{ botStore.stats.totalVolume }}</span>
      </div>
      <div class="summary-item">
        <span class="label">总收益：</span>
        <span
          class="value"
          :class="{
            positive: botStore.stats.profit > 0,
            negative: botStore.stats.profit < 0,
          }"
        >
          {{ botStore.stats.profit > 0 ? '+' : '' }}{{ botStore.stats.profit }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBotStore } from '@/stores/bot';

const botStore = useBotStore();
</script>

<style lang="scss" scoped>
.stats-summary {
  margin-top: 24px;
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }

  .summary-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border-radius: 6px;

    .label {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);

      &.positive {
        color: var(--success);
      }

      &.negative {
        color: var(--error);
      }
    }
  }
}

@media (max-width: 768px) {
  .summary-content {
    grid-template-columns: 1fr;
  }
}
</style>
