<template>
  <!-- 顶部导航栏 -->
  <header class="header">
    <div class="header-left">
      <UserSelector />
    </div>

    <div class="header-center">
      <nav class="nav-menu">
        <router-link
          :to="{ path: '/', query: $route.query }"
          class="nav-link"
          :class="{ active: $route.name === 'binance' }"
        >
          Binance
        </router-link>
        <router-link
          :to="{ path: '/okx', query: $route.query }"
          class="nav-link"
          :class="{ active: $route.name === 'okx' }"
          v-if="showOKXLink"
        >
          OKX
        </router-link>
        <router-link
          :to="{ path: '/gate', query: $route.query }"
          class="nav-link"
          :class="{ active: $route.name === 'gate' }"
        >
          Gate
        </router-link>
        <!-- <router-link to="/bot" class="nav-link" :class="{ active: $route.name === 'bot' }">
          Bot
        </router-link> -->
      </nav>
    </div>

    <div class="header-right">
      <button v-if="showFastConfig" class="icon-btn" title="快捷配置" @click="toggleSettingsModal">
        <span class="config-icon">⚙️</span>
      </button>
      <!-- <button v-if="showImportExportIcon" class="icon-btn" title="导入导出">
        <span class="import-export-icon">📁</span>
      </button> -->
      <button v-if="showThemeIcon" class="icon-btn" title="切换主题" @click="toggleTheme">
        <span class="theme-icon">{{ currentTheme === 'light' ? '☀️' : '🌙' }}</span>
      </button>
      <button class="icon-btn" title="操作日志" @click="toggleLogModal">
        <span class="log-icon">📋</span>
      </button>
    </div>
  </header>

  <!-- 设置弹窗 -->
  <SettingsModal :visible="showSettingsModal" @close="toggleSettingsModal" />

  <!-- 日志弹窗 -->
  <LogModal :visible="showLogModal" @close="toggleLogModal" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

// 获取 store
const appStore = useAppStore()

// 设置弹窗状态
const showSettingsModal = ref(false)

// 日志弹窗状态
const showLogModal = ref(false)

// 内部状态管理
const currentTheme = computed(() => appStore.binance.config?.theme || 'light')

// 按钮显示控制
const showFastConfig = computed(() => appStore.binance.config?.showFastConfig)
const showThemeIcon = computed(() => appStore.binance.config?.showThemeIcon)
const showOKXLink = computed(() => appStore.currentUser?.config?.showOKXLink)

// 切换设置弹窗打开状态
const toggleSettingsModal = () => {
  showSettingsModal.value = !showSettingsModal.value
}

// 切换日志弹窗打开状态
const toggleLogModal = () => {
  showLogModal.value = !showLogModal.value
}

// 切换主题
const toggleTheme = async () => {
  try {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    await appStore.binance.updateUserConfigAction({
      configKey: 'theme',
      configValue: newTheme,
      name: '主题',
      action: '切换主题',
    })
  } catch (error) {
    console.error('❌ 主题更新出错:', error)
  }
}
</script>

<style lang="scss" scoped>
// 导航栏样式
.header {
  background: var(--header-bg);
  padding: 16px 24px;
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
    gap: 16px;
  }

  &-center {
    text-align: center;
    flex: 1;
  }
}

// 导航菜单
.nav-menu {
  display: flex;
  gap: 24px;
  justify-content: center;

  .nav-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 20px;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;

    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      color: white;
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// 用户资料按钮
.user-profile {
  position: relative;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform 0.3s ease;

  &.rotated {
    transform: rotate(180deg);
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

  &.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.menu-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s ease;
  color: var(--text-primary);

  &:hover {
    background: var(--bg-secondary);
  }

  &.active {
    color: var(--primary);
  }
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
  font-size: 19px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.import-export-icon {
  font-size: 1.2rem;
}

/* 简化的响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
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
}
</style>
