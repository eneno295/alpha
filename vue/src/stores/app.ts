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

  // 初始化当前用户为第一个用户
  const initializeCurrentUser = () => {
    if (profitData.value?.data) {
      const availableUsers = Object.keys(profitData.value.data)
      if (availableUsers.length > 0) {
        const firstUserId = availableUsers[0]
        currentUser.value = profitData.value.data[firstUserId]
        console.log('👤 当前用户:', firstUserId)
      }
    }
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
    updateData,
    updateUserConfigAction
  }
}) 