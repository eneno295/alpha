<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const toastRef = ref<InstanceType<typeof Toast> | null>(null)
const { setToastInstance } = useToast()

onMounted(() => {
  if (toastRef.value) {
    setToastInstance({
      show: (message: string, duration?: number) => {
        toastRef.value?.show(message, duration)
      },
      hide: () => {
        toastRef.value?.hide()
      },
    })
  }
})
</script>

<template>
  <div id="app">
    <RouterView />

    <!-- 全局加载状态组件 -->
    <LoadingSpinner />

    <!-- 全局 Toast 组件 -->
    <Toast ref="toastRef" />
  </div>
</template>
