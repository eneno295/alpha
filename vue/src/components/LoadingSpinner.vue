<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoading } from '@/composables/useLoading'

// 直接使用全局加载状态
const { isLoading, loadingMessage } = useLoading()
</script>

<style lang="scss" scoped>
// 加载状态样式
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-spinner p {
  color: var(--text-primary);
  margin: 0;
  font-size: 0.9rem;
}
</style>
