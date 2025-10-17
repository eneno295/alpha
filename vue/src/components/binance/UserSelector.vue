<template>
  <div class="user-profile">
    <button class="profile-btn" @click="toggleUserMenu">
      <span class="profile-icon">👤</span>
      <span>{{ currentUserName }}</span>
      <span class="dropdown-arrow" :class="{ rotated: isMenuOpen }" v-if="selectAvailable">▼</span>
    </button>

    <div class="user-menu" :class="{ show: isMenuOpen }">
      <div
        v-for="userName in availableUsers"
        :key="userName"
        :class="['menu-item', { active: userName === currentUserName }]"
        @click="selectUser(userName)"
      >
        {{ userName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'

// 获取 store
const appStore = useAppStore()

// 用户菜单状态
const isMenuOpen = ref(false)

// 当前用户名
const currentUserName = computed(() => appStore.currentUserName)

// 计算可用用户列表
const availableUsers = computed(() => appStore.availableUsers || [])

// 下拉框是否可用
const selectAvailable = computed(() => availableUsers.value.length > 1)

// 切换用户菜单
const toggleUserMenu = () => {
  if (!selectAvailable.value) return
  isMenuOpen.value = !isMenuOpen.value
}

// 选择用户
const selectUser = (userName: string) => {
  // 切换 appStore 中的当前用户
  appStore.toggleUser(userName)
  isMenuOpen.value = false
}

// 点击外部关闭菜单
const closeMenu = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.user-profile')) {
    isMenuOpen.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<style lang="scss" scoped>
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
</style>
