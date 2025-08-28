<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDataFromAPI } from '@/api'
import type { ProfitData } from '@/types'
import Header from '@/components/profit/Header.vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'

// 加载状态管理
const { showLoadingState, hideLoadingState } = useLoading()

// 获取 store
const store = useAppStore()

const initializeApp = async () => {
  // 显示加载状态
  showLoadingState()

  try {
    // 从API获取数据
    const data = await fetchDataFromAPI()
    store.profitData = data
    // 初始化当前用户数据
    store.initializeCurrentUser()
  } catch (error) {
    console.error('数据加载失败:', error)
  }

  // 应用用户配置
  // applyUserConfig();

  // updateThemeIcon();
  // updateCalendarDisplayIcon();

  // 更新用户显示和配置可见性
  // updateUserDisplay();
  // updateConfigVisibility();

  // // 渲染日历
  // renderCalendar();

  // // 更新统计数据
  // updateStats();

  // // 更新每日摘要
  // updateDailySummary();

  // // 绑定事件监听器
  // bindEventListeners();

  // // 初始化箭头状态
  // updateArrowStates();

  // 隐藏加载状态
  hideLoadingState()
}

// 页面逻辑
onMounted(() => {
  initializeApp()
})
</script>

<template>
  <div class="app-container">
    <!-- 使用 Header 组件 -->
    <Header />

    <!-- 主要内容区域 -->
    <main>
      <h2>欢迎使用 Binance Alpha 收益日历</h2>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}
</style>
