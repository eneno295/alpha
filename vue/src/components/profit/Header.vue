<template>
  <!-- 顶部导航栏 -->
  <header class="header">
    <div class="header-left">
      <UserSelector />
    </div>

    <div class="header-center">
      <h1 class="main-title">Binance Alpha 收益日历</h1>
    </div>

    <div class="header-right">
      <button class="icon-btn" title="导入导出">
        <span class="import-export-icon">📁</span>
      </button>
      <button class="icon-btn" title="切换日历显示模式" @click="toggleCalendarDisplayMode">
        <span class="calendar-display-icon">{{
          calendarDisplayMode === 'claimable' ? '📊' : '🎯'
        }}</span>
      </button>
      <button class="icon-btn" title="切换主题" @click="toggleTheme">
        <span class="theme-icon">{{ currentTheme === 'light' ? '☀️' : '🌙' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import UserSelector from './UserSelector.vue'

// 获取 store
const store = useAppStore()

// 内部状态管理
const currentTheme = computed(() => store.currentConfig?.theme || 'light')
const calendarDisplayMode = computed(() => store.currentConfig?.calendarDisplayMode || 'claimable')

// 切换主题
const toggleTheme = async () => {
  if (!store.currentUser) return

  try {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    const res = await store.updateUserConfigAction(store.currentConfig.userName, 'theme', newTheme)
  } catch (error) {
    console.error('❌ 主题更新出错:', error)
  }
}

// 切换日历显示模式
const toggleCalendarDisplayMode = async () => {
  if (!store.currentUser) return

  try {
    const newMode = calendarDisplayMode.value === 'claimable' ? 'score' : 'claimable'
    const res = await store.updateUserConfigAction(
      store.currentConfig.userName,
      'calendarDisplayMode',
      newMode,
    )
  } catch (error) {
    console.error('❌ 日历显示模式更新出错:', error)
  }
}
</script>

<style lang="scss" scoped>
// 导航栏样式
.header {
  background: var(--gradient-primary);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;

  &-left,
  &-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &-center {
    text-align: center;
    flex: 1;
  }
}

.main-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

// 用户资料按钮
.user-profile {
  position: relative;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.user-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  min-width: 150px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
}

// 图标按钮
.icon-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
}

.import-export-icon {
  font-size: 1.2rem;
}

// 响应式设计
@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;

    &-center {
      flex: 1;
      text-align: center;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: auto;
    }
  }

  .main-title {
    display: none;
  }
}
</style>
