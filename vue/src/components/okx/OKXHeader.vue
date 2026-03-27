<template>
  <div class="okx-header">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <UserSelector />
      </div>

      <div class="header-center">
        <nav class="nav-menu">
          <router-link
            :to="{ path: '/income', query: $route.query }"
            class="nav-link"
            :class="{ active: $route.name === 'income' }"
          >
            <div class="pc-text">
              <GradientText text="Income" style="font-size: 18px" />
            </div>
            <div class="mobile-text">I</div>
          </router-link>
          <router-link
            :to="{ path: '/binance', query: $route.query }"
            class="nav-link"
            :class="{ active: $route.name === 'binance' }"
          >
            <div class="pc-text">
              <GradientText text="Binance" style="font-size: 18px" />
            </div>
            <div class="mobile-text">B</div>
          </router-link>
          <router-link
            :to="{ path: '/okx', query: $route.query }"
            class="nav-link"
            :class="{ active: $route.name === 'okx' }"
          >
            <div class="pc-text">
              <GradientText text="OKX" style="font-size: 18px" />
            </div>
            <div class="mobile-text">O</div>
          </router-link>
          <router-link
            :to="{ path: '/gate', query: $route.query }"
            class="nav-link"
            :class="{ active: $route.name === 'gate' }"
          >
            <div class="pc-text">
              <GradientText text="Gate" style="font-size: 18px" />
            </div>
            <div class="mobile-text">G</div>
          </router-link>
        </nav>
      </div>

      <div class="header-right">
        <button
          v-if="showFastConfig"
          class="icon-btn"
          title="快捷配置"
          @click="toggleSettingsModal"
        >
          <span class="config-icon">⚙️</span>
        </button>
        <button class="icon-btn" title="操作日志" @click="toggleLogModal">
          <span class="log-icon">📋</span>
        </button>
      </div>
    </header>

    <!-- 设置弹窗 -->
    <OKXSettingsModal
      :visible="showSettingsModal"
      @close="toggleSettingsModal"
      @success="handleSettingsSuccess"
    />

    <!-- 日志弹窗 -->
    <OKXLogModal :visible="showLogModal" @close="toggleLogModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 按钮显示控制
const showFastConfig = computed(() => appStore.okx.config?.showFastConfig)

// 设置弹窗状态
const showSettingsModal = ref(false)

// 日志弹窗状态
const showLogModal = ref(false)

// 切换设置弹窗打开状态
const toggleSettingsModal = () => {
  showSettingsModal.value = !showSettingsModal.value
}

// 切换日志弹窗打开状态
const toggleLogModal = () => {
  showLogModal.value = !showLogModal.value
}

// 处理设置成功
const handleSettingsSuccess = () => {
  // 可以在这里添加成功后的处理逻辑
  console.log('设置更新成功')
}
</script>

<style lang="scss" scoped>
// 导航栏样式
.header {
  backdrop-filter: blur(20px);
  padding: 5px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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

  &-right {
    .icon-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      width: 40px;
      height: 40px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      .log-icon {
        font-size: 1.2rem;
      }
    }
  }

  .pc-text {
    display: block;
  }
  .mobile-text {
    display: none;
  }
}

// 导航菜单
.nav-menu {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin: 10px 0;
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

// 响应式设计
@media (max-width: 768px) {
  .header {
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    border-radius: 12px;

    &-center {
      flex: 1;
      text-align: center;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: auto;

      .icon-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
      }
    }

    .pc-text {
      display: none;
    }
    .mobile-text {
      display: block;
    }
  }
}
</style>
