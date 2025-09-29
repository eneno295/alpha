<template>
  <!-- 全局提示框 -->
  <div v-if="visible" class="toast-overlay">
    <div :class="['toast', `toast-${type}`]">
      <div class="toast-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-else-if="type === 'error'">❌</span>
        <span v-else-if="type === 'warning'">⚠️</span>
        <span v-else-if="type === 'info'">ℹ️</span>
      </div>
      <div class="toast-content">
        <div class="toast-title">{{ title }}</div>
        <div v-if="message" class="toast-message">{{ message }}</div>
      </div>
      <button class="toast-close" @click="close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface ToastProps {
  visible: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  duration: 3000,
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(props.visible)

// 自动关闭
let timer: number | null = null

const startTimer = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    close()
  }, props.duration)
}

const close = () => {
  visible.value = false
  emit('close')
}

watch(
  () => props.visible,
  (newVisible) => {
    visible.value = newVisible
    if (newVisible) {
      startTimer()
    } else if (timer) {
      clearTimeout(timer)
    }
  },
)

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
.toast-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 16px;
  min-width: 300px;
  max-width: 400px;
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;

  &.toast-success {
    border-left: 4px solid var(--success);

    .toast-icon {
      color: var(--success);
    }
  }

  &.toast-error {
    border-left: 4px solid var(--error);

    .toast-icon {
      color: var(--error);
    }
  }

  &.toast-warning {
    border-left: 4px solid var(--warning);

    .toast-icon {
      color: var(--warning);
    }
  }

  &.toast-info {
    border-left: 4px solid var(--primary);

    .toast-icon {
      color: var(--primary);
    }
  }
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;

  .toast-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .toast-message {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.4;
  }
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toast-overlay {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
