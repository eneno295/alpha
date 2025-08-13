import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProfitData, UserConfig, DateRecord, UserData } from '@/types'
import { updateDataInAPI, updateUserConfig } from '@/api'

export const useAppStore = defineStore('app', () => {
  // 收益日历数据
  const profitData = ref<ProfitData>({
    users: [],
    data: {}
  })

  // 当前用户数据
  const currentUser = ref<UserData | null>(null)

  // 当前用户配置
  const currentConfig = computed(() => {
    // 设置主题
    if (currentUser.value?.config) {
      document.documentElement.setAttribute('data-theme', currentUser.value.config.theme)
    }

    return currentUser.value?.config || {
      userName: '暂无用户',
      theme: 'light',
      calendarDisplayMode: 'claimable'
    }
  })

  // 当前用户收益数据
  const currentProfitData = computed(() => {
    return currentUser.value?.date || []
  })

  // 初始化当前用户
  const initializeCurrentUser = () => {
    if (profitData.value?.data) {
      const availableUsers = Object.keys(profitData.value.data)
      if (availableUsers.length > 0) {
        // 從本地存儲獲取上次選擇的用戶
        const savedUser = localStorage.getItem('selectedUser')
        const userId = savedUser && availableUsers.includes(savedUser)
          ? savedUser
          : availableUsers[0]

        currentUser.value = profitData.value.data[userId]
        console.log('👤 当前用户:', userId)
      }
    }
  }

  // 設置當前用戶
  const setCurrentUser = (userData: UserData) => {
    currentUser.value = userData

    // 保存用戶選擇到本地存儲
    const userId = Object.keys(profitData.value?.data || {}).find(
      key => profitData.value?.data[key] === userData
    )
    if (userId) {
      localStorage.setItem('selectedUser', userId)
    }

    // 應用用戶配置
    if (userData.config) {
      // 設置主題
      document.documentElement.setAttribute('data-theme', userData.config.theme)
    }
  }

  // 設置收益數據
  const setProfitData = (data: ProfitData) => {
    profitData.value = data
  }

  // 更新数据到 API
  const updateData = async (newData: ProfitData) => {
    const res = await updateDataInAPI(newData)
    if (res) {
      profitData.value = res as unknown as ProfitData
    }
    return res
  }

  // 更新用户配置
  const updateUserConfigAction = async (
    userName: string,
    configKey: keyof UserConfig,
    configValue: UserConfig[keyof UserConfig]
  ): Promise<boolean> => {
    // 檢查數據是否存在
    if (!profitData.value) {
      console.error('❌ profitData 不存在，無法更新用戶配置')
      return false
    }

    const res = await updateUserConfig(
      userName,
      configKey,
      configValue,
      profitData.value,
    )
    return res ? true : false
  }

  return {
    profitData,
    currentUser,
    currentConfig,
    currentProfitData,
    initializeCurrentUser,
    setCurrentUser,
    setProfitData,
    updateData,
    updateUserConfigAction
  }
})
