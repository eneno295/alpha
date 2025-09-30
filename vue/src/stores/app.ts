import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProfitData, UserConfig, DateRecord, UserData, LogEntry } from '@/types'
import { updateDataInAPI, updateUserConfig, updateUserConfigs, getUserIP } from '@/api'

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

  // 公共函数：创建日志条目并添加到数组
  const createLogEntry = async (
    action: string,
    type: 'addRecord' | 'editRecord' | 'clearRecord' | 'editConfigs' | 'editConfig',
    details?: string,
  ): Promise<void> => {
    if (!currentUser.value) throw new Error('当前用户不存在')

    const ip = await getUserIP()

    // 确保 log 数组存在
    if (!currentUser.value.log) {
      currentUser.value.log = []
    }

    // 生成新的ID
    const maxId =
      currentUser.value.log.length > 0 ? Math.max(...currentUser.value.log.map((log) => log.id)) : 0

    const logEntry: LogEntry = {
      id: maxId + 1,
      timestamp: Date.now(),
      action,
      type,
      details,
      ip,
    }

    // 添加新日志到开头
    currentUser.value.log.unshift(logEntry)
  }

  // 更新数据到 API
  const updateData = async (
    newData: ProfitData,
    logEntry?: { action: string; type: 'addRecord' | 'editRecord' | 'clearRecord'; details?: string },
  ) => {
    // 如果提供了日志信息，先在内存中添加日志（在调用API之前）
    if (logEntry && currentUser.value) {
      try {
        await createLogEntry(logEntry.action, logEntry.type, logEntry.details)

        // 更新 newData 中的当前用户数据
        if (currentUser.value.config.userName) {
          newData.data[currentUser.value.config.userName] = currentUser.value
        }
      } catch (error) {
        console.error('❌ 日志记录失败:', error)
      }
    }

    // 只调用一次API，包含数据更新和日志
    const res = await updateDataInAPI(newData)
    return res
  }

  // 更新用户配置（单个配置项）
  const updateUserConfigAction = async (
    userName: string | undefined,
    configKey: keyof UserConfig,
    configValue: UserConfig[keyof UserConfig],
    configName: string,
  ): Promise<boolean> => {
    if (!userName || !currentUser.value) return false

    try {
      // 获取旧配置值
      const oldValue = currentUser.value.config[configKey]

      // 添加日志
      await createLogEntry(
        '修改配置',
        'editConfig',
        JSON.stringify({
          oldData: { name: configName, value: oldValue },
          newData: { name: configName, value: configValue },
        }),
      )

      // 更新 profitData 中的当前用户数据
      profitData.value.data[userName] = currentUser.value

      // 调用 API 更新配置
      const res = await updateUserConfig(userName, configKey, configValue, profitData.value)
      return res ? true : false
    } catch (error) {
      console.error('❌ 单个配置更新失败:', error)
      return false
    }
  }

  // 批量更新用户配置
  const updateUserConfigsAction = async (
    userName: string | undefined,
    configs: Partial<UserConfig>,
    logDetails?: { oldData: any; newData: any },
  ): Promise<boolean> => {
    if (!userName) return false

    try {
      // 如果提供了日志详情，先在内存中添加日志（在调用API之前）
      if (logDetails && currentUser.value) {
        await createLogEntry('批量修改配置', 'editConfigs', JSON.stringify(logDetails))

        // 更新 profitData 中的当前用户数据
        profitData.value.data[userName] = currentUser.value
      }

      // 只调用一次API，包含配置更新和日志
      const success = await updateUserConfigs(userName, configs, profitData.value)
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

  // 清空日志
  const clearLogs = async () => {
    if (!currentUser.value) return

    try {
      // 直接清空日志数组，不记录清空操作
      currentUser.value.log = []
      await updateData(profitData.value)
      console.log('✅ 日志清空成功')
    } catch (error) {
      console.error('❌ 日志清空失败:', error)
    }
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
    clearLogs,
  }
})