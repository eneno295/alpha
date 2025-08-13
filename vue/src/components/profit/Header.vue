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
      <button class="icon-btn" title="导入导出" @click="openImportExportModal">
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
import { useToast } from '@/composables/useToast'

// 获取 store
const store = useAppStore()

// 获取 Toast 服务
const { showSuccessMessage } = useToast()

// 内部状态管理
const currentTheme = computed(() => store.currentConfig?.theme || 'light')
const calendarDisplayMode = computed(() => store.currentConfig?.calendarDisplayMode || 'claimable')

// 获取当前用户ID
const getCurrentUserId = () => {
  if (!store.profitData?.data) return null

  const userId = Object.keys(store.profitData.data).find(
    (key) => store.profitData?.data[key] === store.currentUser,
  )
  return userId
}

// 切换主题
const toggleTheme = async () => {
  if (!store.currentUser) return

  const userId = getCurrentUserId()
  if (!userId) {
    console.error('❌ 無法獲取當前用戶ID')
    return
  }

  try {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    const res = await store.updateUserConfigAction(userId, 'theme', newTheme)
    if (res) {
      showSuccessMessage('✅ 主題切換成功！')
    }
  } catch (error) {
    console.error('❌ 主题更新出错:', error)
  }
}

// 切换日历显示模式
const toggleCalendarDisplayMode = async () => {
  if (!store.currentUser) return

  const userId = getCurrentUserId()
  if (!userId) {
    console.error('❌ 無法獲取當前用戶ID')
    return
  }

  try {
    const newMode = calendarDisplayMode.value === 'claimable' ? 'score' : 'claimable'
    const res = await store.updateUserConfigAction(userId, 'calendarDisplayMode', newMode)
    if (res) {
      showSuccessMessage('✅ 日曆顯示模式切換成功！')
    }
  } catch (error) {
    console.error('❌ 日历显示模式更新出错:', error)
  }
}

// 打開導入導出模態框
const openImportExportModal = () => {
  // 通過事件通知父組件
  window.dispatchEvent(new CustomEvent('openImportExportModal'))
}

// 更新主題圖標
const updateThemeIcon = () => {
  const themeIcon = document.querySelector('.theme-icon')
  if (themeIcon) {
    themeIcon.textContent = currentTheme.value === 'light' ? '☀️' : '🌙'
  }
}

// 監聽主題變化
watch(currentTheme, () => {
  updateThemeIcon()
})
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
