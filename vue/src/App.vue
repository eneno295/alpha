<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue'
</script>

<template>
  <div id="app">
    <RouterView />

    <!-- 全局加载状态组件 -->
    <LoadingSpinner />
  </div>
</template>
