<script setup lang="ts">
import FloatingTaskButton from '@/components/common/FloatingTaskButton.vue'
</script>

<template>
  <div id="app">
    <RouterView />

    <!-- 全局加载状态组件 -->
    <LoadingSpinner />

    <!-- 全局悬浮任务按钮 -->
    <FloatingTaskButton />
  </div>
</template>
