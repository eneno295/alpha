<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { fetchDataFromAPI } from '@/api'
import Header from '@/components/profit/Header.vue'
import StatsCards from '@/components/profit/StatsCards.vue'
import Calendar from '@/components/profit/Calendar.vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'

// 加载状态管理
const { withLoading } = useLoading()

// 获取 store
const store = useAppStore()

// 定时器相关
let refreshTimer: number | null = null

// 模拟积分相关
const showSimulationScore = computed(() => store.currentConfig?.showSimulationScore)
const openSimulation = computed(() => store.openSimulation)

// 积分显示模式
const scoreDisplayMode = computed(() => store.scoreDisplayMode)

// 切换模拟积分
const toggleSimulationStatus = async () => {
  store.toggleSimulation()
}

// 设置积分显示模式
const setScoreMode = (mode: 'current' | 'today' | 'add') => {
  store.setScoreDisplayMode(mode)
}

// 获取最新数据
const fetchLatestData = async () => {
  try {
    const data = await fetchDataFromAPI()
    store.profitData = data
    // 重新初始化当前用户数据
    store.initializeCurrentUser()
    console.log('✅ 数据已更新')
  } catch (error) {
    console.error('❌ 数据更新失败:', error)
  }
}

const initializeApp = async () => {
  try {
    await withLoading(async () => {
      // 从API获取数据
      const data = await fetchDataFromAPI()
      store.profitData = data
      // 初始化当前用户数据
      store.initializeCurrentUser()
    }, '加载数据中...')
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

// 启动定时器
const startRefreshTimer = () => {
  // 清除现有定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  // 设置10分钟定时器 (10 * 60 * 1000 = 600000毫秒)
  refreshTimer = setInterval(
    () => {
      console.log('🔄 定时器触发，开始更新数据...')
      fetchLatestData()
    },
    10 * 60 * 1000,
  )

  console.log('⏰ 定时器已启动，每10分钟更新一次数据')
}

// 页面逻辑
onMounted(() => {
  initializeApp()
  // 启动定时器
  startRefreshTimer()
})

// 页面卸载时清理定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
    console.log('⏹️ 定时器已停止')
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 头部 -->
    <Header />

    <!-- 统计卡片 -->
    <StatsCards />

    <!-- 日历 -->
    <Calendar />

    <!-- 右侧悬浮按钮组 -->
    <div class="floating-buttons">
      <!-- 当前积分按钮 -->
      <button
        class="floating-btn current-score-btn"
        :class="{ active: scoreDisplayMode === 'current' }"
        title="当前积分"
        @click="setScoreMode('current')"
      >
        <span class="btn-icon">📊</span>
        <span class="btn-text">当前积分</span>
      </button>

      <!-- 刷的积分按钮 -->
      <button
        class="floating-btn today-score-btn"
        :class="{ active: scoreDisplayMode === 'today' }"
        title="刷的积分"
        @click="setScoreMode('today')"
      >
        <span class="btn-icon">⚡</span>
        <span class="btn-text">刷的积分</span>
      </button>

      <!-- 添加积分按钮 -->
      <button
        class="floating-btn add-score-btn"
        :class="{ active: scoreDisplayMode === 'add' }"
        title="添加积分"
        @click="setScoreMode('add')"
      >
        <span class="btn-icon">➕</span>
        <span class="btn-text">添加积分</span>
      </button>

      <!-- 模拟积分按钮 -->
      <button
        v-if="showSimulationScore"
        class="floating-btn simulation-btn"
        :class="{ active: openSimulation }"
        title="模拟积分"
        @click="toggleSimulationStatus"
      >
        <span class="btn-icon">🧮</span>
        <span class="btn-text">模拟积分</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  overflow-x: hidden;
}

// 右侧悬浮按钮组
.floating-buttons {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.floating-btn {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:hover {
    transform: translateX(-4px) scale(1.02);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    border-color: var(--border-glow);
  }

  .btn-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .btn-text {
    white-space: nowrap;
  }

  // 不同按钮的主题色
  &.current-score-btn {
    border-color: var(--primary);
    background: var(--gradient-button);

    &:hover,
    &.active {
      background: var(--gradient-primary);
      color: white;
      box-shadow:
        var(--shadow-lg),
        0 0 20px rgba(59, 130, 246, 0.4);
    }

    &.active {
      box-shadow:
        0 0 0 3px rgba(59, 130, 246, 0.3),
        0 0 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.today-score-btn {
    border-color: var(--primary);
    background: var(--gradient-button);

    &:hover,
    &.active {
      background: var(--gradient-primary);
      color: white;
      box-shadow:
        var(--shadow-lg),
        0 0 20px rgba(59, 130, 246, 0.4);
    }

    &.active {
      box-shadow:
        0 0 0 3px rgba(59, 130, 246, 0.3),
        0 0 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.add-score-btn {
    border-color: var(--success);
    background: var(--gradient-button);

    &:hover,
    &.active {
      background: var(--gradient-success);
      color: white;
      box-shadow:
        var(--shadow-lg),
        0 0 20px rgba(16, 185, 129, 0.4);
    }

    &.active {
      box-shadow:
        0 0 0 3px rgba(34, 197, 94, 0.3),
        0 0 20px rgba(16, 185, 129, 0.4);
    }
  }

  &.simulation-btn {
    border-color: var(--warning);
    background: var(--gradient-button);

    &:hover {
      background: var(--gradient-warning);
      color: white;
      box-shadow:
        var(--shadow-lg),
        0 0 20px rgba(245, 158, 11, 0.4);
    }

    &.active {
      background: var(--gradient-warning);
      color: white;
      border-color: var(--warning);
      box-shadow:
        0 0 0 3px rgba(255, 193, 7, 0.3),
        0 0 20px rgba(245, 158, 11, 0.4);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-buttons {
    top: 170px;
    right: 15px;
    gap: 8px;
  }

  .floating-btn {
    padding: 10px 12px;
    font-size: 12px;

    .btn-icon {
      font-size: 14px;
    }

    .btn-text {
      display: none; // 小屏幕隐藏文字，只显示图标
    }
  }
}
</style>
