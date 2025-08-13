<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="isVisible" class="success-toast">
        <div v-if="currentMessage.includes('\n')" v-html="formattedMessage"></div>
        <div v-else>{{ currentMessage }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const isVisible = ref(false)
const currentMessage = ref('')

let timer: number | null = null

const formattedMessage = computed(() => {
  return currentMessage.value.replace(/\n/g, '<br>')
})

const show = (message: string, duration: number = 3000) => {
  currentMessage.value = message
  isVisible.value = true

  const displayTime = message.includes('\n') ? 5000 : duration

  timer = window.setTimeout(() => {
    hide()
  }, displayTime)
}

const hide = () => {
  isVisible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

defineExpose({
  show,
  hide,
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<style scoped>
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--success);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 10001;
  max-width: 400px;
  line-height: 1.4;
  font-size: 14px;
}

/* 動畫效果 */
.toast-enter-active {
  animation: slideInRight 0.3s ease;
}

.toast-leave-active {
  animation: slideOutRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
