<template>
  <section class="connection-status">
    <div class="status-grid">
      <div class="status-item">
        <span class="status-label">WebSocket 连接</span>
        <span class="status-value" :class="{ connected: wsStatus.isConnected }">
          {{ wsStatus.isConnected ? '已连接' : '未连接' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { wsStatus } from '@/composables/useWebSocket'
</script>

<style lang="scss" scoped>
.connection-status {
  margin-bottom: 24px;
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

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border-radius: 6px;

    .status-label {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .status-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--error);

      &.connected {
        color: var(--success);
      }
    }
  }
}

@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
