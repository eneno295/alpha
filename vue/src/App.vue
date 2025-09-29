<script setup lang="ts">
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
</script>

<template>
  <div id="app">
    <RouterView />

    <!-- 全局加载状态组件 -->
    <LoadingSpinner />
  </div>
</template>
