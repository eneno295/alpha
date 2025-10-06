<template>
  <div class="log-card">
    <div class="log-header">
      <h3>操作日志</h3>
      <button class="btn-clear" @click="handleClear">清空</button>
    </div>
    <div class="log-content">
      <div
        v-for="(log, index) in botStore.tradeLogs"
        :key="index"
        class="log-item"
        :class="log.type"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
    <div class="log-footer">最后更新: {{ botStore.lastUpdateTime }}</div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '@/stores/bot';

const botStore = useBotStore();

// 处理清空
const handleClear = () => {
  botStore.clearLogs();
};
</script>

<style lang="scss" scoped>
.log-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  height: 400px;
  display: flex;
  flex-direction: column;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-clear {
      background: var(--error);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #dc2626;
      }
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 12px;

    .log-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 12px;

      &:last-child {
        border-bottom: none;
      }

      .log-time {
        color: var(--text-muted);
        margin-right: 8px;
        min-width: 60px;
      }

      .log-message {
        flex: 1;
        word-break: break-all;
      }

      &.success {
        background: rgba(34, 197, 94, 0.1);
        border-radius: 4px;
        padding: 4px 8px;
        margin: 2px 0;
      }

      &.error {
        background: rgba(239, 68, 68, 0.1);
        border-radius: 4px;
        padding: 4px 8px;
        margin: 2px 0;
      }

      &.warning {
        background: rgba(245, 158, 11, 0.1);
        border-radius: 4px;
        padding: 4px 8px;
        margin: 2px 0;
      }

      &.info {
        background: rgba(59, 130, 246, 0.1);
        border-radius: 4px;
        padding: 4px 8px;
        margin: 2px 0;
      }
    }
  }

  .log-footer {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
  }
}
</style>
