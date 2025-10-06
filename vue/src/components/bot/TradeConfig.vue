<template>
  <div class="config-card">
    <h3>交易对配置</h3>
    <div class="config-form">
      <div class="form-group">
        <label>交易对</label>
        <!-- :disabled="botStore.isRunning" -->
        <select v-model="botStore.config.symbol">
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
          v-model="botStore.config.triggerPrice"
          placeholder="输入触发价格"
        />
      </div>
      <div class="form-group">
        <label>交易金额 (USDT)</label>
        <input
          type="number"
          v-model="botStore.config.money"
          placeholder="输入交易金额"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useBotStore } from '@/stores/bot';

const botStore = useBotStore();

// 监听配置变化
watch(
  () => botStore.config,
  (newConfig, oldConfig) => {
    if (oldConfig) {
      botStore.addLog(
        `交易对已更改: ${newConfig.symbol}（${newConfig.triggerPrice}）: ${newConfig.money}`,
        'success'
      );
      // 交易对变化时重新连接 WebSocket
      botStore.updateSymbol(newConfig.symbol);
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.config-card {
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

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

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
  }
}
</style>
