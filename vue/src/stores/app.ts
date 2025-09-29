import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProfitData, UserConfig, DateRecord, UserData } from '@/types'
import { updateDataInAPI, updateUserConfig, updateUserConfigs } from '@/api'

export const useAppStore = defineStore('app', () => {
  // 收益日历数据
  const profitData = ref<ProfitData>({
    users: [],
    data: {},
  })

  // 当前用户数据
  const currentUser = ref<UserData | null>(null)

  // 当前用户配置
  const currentConfig = computed(() => {
    // 设置主题
    if (currentUser.value?.config) {
      document.documentElement.setAttribute('data-theme', currentUser.value.config.theme)
    }

    return currentUser.value?.config || null
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

  // 切换用户
  const toggleUser = (userName: string) => {
    currentUser.value = profitData.value.data[userName]
    console.log('👤 当前用户:', currentUser.value?.config?.userName)
  }

  // 更新数据到 API
  const updateData = async (newData: ProfitData) => {
    const res = await updateDataInAPI(newData)
    if (res) {
      // 更新成功，保持原有数据结构
      console.log('✅ 数据更新成功')
    } else {
      console.error('❌ 数据更新失败')
    }
    return res
  }

  // 更新用户配置
  const updateUserConfigAction = async (
    userName: string | undefined,
    configKey: keyof UserConfig,
    configValue: UserConfig[keyof UserConfig],
  ): Promise<boolean> => {
    if (!userName) return false

    const res = await updateUserConfig(
      userName,
      configKey,
      configValue,
      profitData.value,
    )
    return res ? true : false
  }

  // 批量更新用户配置
  const updateUserConfigsAction = async (
    userName: string | undefined,
    configs: Partial<UserConfig>,
  ): Promise<boolean> => {
    if (!userName) return false

    try {
      // 使用新的批量更新API，只调用一次
      const success = await updateUserConfigs(userName, configs, profitData.value)

      if (success) {
        console.log('✅ 批量配置更新成功:', configs)
      } else {
        console.error('❌ 批量配置更新失败')
      }

      return success
    } catch (error) {
      console.error('❌ 批量配置更新失败:', error)
      return false
    }
  }

  // 是否开启模拟积分计算
  const openSimulation = ref(false)

  const toggleSimulation = () => {
    openSimulation.value = !openSimulation.value
  }

  // 积分显示模式
  const scoreDisplayMode = ref<'current' | 'today' | 'add'>('current')

  const setScoreDisplayMode = (mode: 'current' | 'today' | 'add') => {
    scoreDisplayMode.value = mode
  }

  return {
    profitData,
    currentUser,
    currentConfig,
    currentProfitData,
    initializeCurrentUser,
    updateData,
    updateUserConfigAction,
    updateUserConfigsAction,
    toggleUser,
    toggleSimulation,
    openSimulation,
    scoreDisplayMode,
    setScoreDisplayMode,
  }
})