<template>
  <div class="floating-buttons">
    <button
      class="floating-btn"
      :class="botStore.isRunning ? 'btn-stop' : 'btn-start'"
      @click="handleToggle"
      :title="botStore.isRunning ? '停止 Bot' : '启动 Bot'"
    >
      <span class="btn-icon">{{ botStore.isRunning ? '⏹' : '▶' }}</span>
      <span class="btn-text">{{ botStore.isRunning ? '停止' : '启动' }}</span>
    </button>
    <button
      class="floating-btn"
      :class="wsStatus.isConnected ? 'btn-disconnect' : 'btn-connect'"
      @click="handleConnection"
      :title="wsStatus.isConnected ? '断开连接' : '连接'"
    >
      <span class="btn-icon">{{ wsStatus.isConnected ? '🔌' : '🔗' }}</span>
      <span class="btn-text">{{ wsStatus.isConnected ? '断开' : '连接' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '@/stores/bot';
import { wsStatus } from '@/composables/useWebSocket';

const botStore = useBotStore();

// 处理启动/停止切换
const handleToggle = async () => {
  if (botStore.isRunning) {
    botStore.stopBot();
  } else {
    await botStore.startBot();
  }
};

// 处理连接/断开切换
const handleConnection = async () => {
  if (wsStatus.value.isConnected) {
    botStore.disconnect();
  } else {
    await botStore.connection();
  }
};
</script>

<style lang="scss" scoped>
.floating-buttons {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;

  .floating-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    opacity: 0.7;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      opacity: 1;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 18px;
      margin-bottom: 2px;
    }

    .btn-text {
      font-size: 10px;
      font-weight: 500;
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

    &.btn-connect {
      background: var(--primary);
      color: white;

      &:hover:not(:disabled) {
        background: #2563eb;
      }
    }

    &.btn-disconnect {
      background: var(--warning);
      color: white;

      &:hover:not(:disabled) {
        background: #d97706;
      }
    }
  }
}

@media (max-width: 768px) {
  .floating-buttons {
    bottom: 20px;
    right: 20px;

    .floating-btn {
      width: 50px;
      height: 50px;

      .btn-icon {
        font-size: 16px;
      }

      .btn-text {
        font-size: 9px;
      }
    }
  }
}
</style>
