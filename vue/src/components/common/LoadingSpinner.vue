<template>
  <div
    v-if="isLoading"
    class="loading-overlay"
    :class="{ 'loading-overlay--transparent': transparent }"
  >
    <div class="loading-content" :class="`loading-content--${size}`">
      <div class="spinner" :class="`spinner--${size}`"></div>
      <p v-if="loadingMessage" class="loading-text" :class="`loading-text--${size}`">
        {{ loadingMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoading } from '@/composables/useLoading'

interface Props {
  transparent?: boolean // 是否透明背景
  size?: 'small' | 'medium' | 'large' // 尺寸大小
}

const props = withDefaults(defineProps<Props>(), {
  transparent: false,
  size: 'medium',
})

// 直接使用全局加载状态
const { isLoading, loadingMessage } = useLoading()
</script>

<style lang="scss" scoped>
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
  z-index: 10001;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;

  &--transparent {
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
}

.loading-content {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  max-width: 300px;
  width: 90%;
  animation: fadeInScale 0.3s ease-out;

  &--small {
    padding: 20px;
    max-width: 200px;
  }

  &--large {
    padding: 40px;
    max-width: 400px;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;

  &--small {
    width: 24px;
    height: 24px;
    border-width: 3px;
    margin-bottom: 12px;
  }

  &--large {
    width: 56px;
    height: 56px;
    border-width: 5px;
    margin-bottom: 20px;
  }
}

.loading-text {
  color: var(--text-primary);
  font-size: 14px;
  margin: 0;
  line-height: 1.4;

  &--small {
    font-size: 12px;
  }

  &--large {
    font-size: 16px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-text {
    font-size: 16px;
  }
}
</style>
