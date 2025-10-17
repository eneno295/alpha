import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProfitData, UserData, LogEntry } from '@/types'
import { updateDataInAPI, getUserIP, fetchDataFromAPI } from '@/api'

export const useAppStore = defineStore('app', () => {
  // ========== 全局状态 ==========
  const profitData = ref<ProfitData>({
    users: [],
    data: {},
  })

  // 当前用户数据
  const currentUser = ref<UserData | null>(null)

  // 当前用户名
  const currentUserName = computed(() => {
    return currentUser.value?.config?.userName || null
  })

  // 可用用户列表
  const availableUsers = computed(() => {
    return profitData.value?.users || []
  })

  // 切换用户
  const toggleUser = (userName: string) => {
    currentUser.value = profitData.value.data[userName]
  }

  // ========== 平台数据模块 ==========
  const platformModules = {
    binance: {
      // ========== Binance 特有功能 ==========
      // 模拟积分
      openSimulation: ref(false),
      // 积分显示模式
      scoreDisplayMode: ref<'current' | 'today' | 'add'>('current'),
      // 切换模拟积分按钮显示状态
      toggleSimulation: () => {
        platformModules.binance.openSimulation.value = !platformModules.binance.openSimulation.value
      },
      // 设置积分显示模式
      setScoreDisplayMode: (mode: 'current' | 'today' | 'add') => {
        platformModules.binance.scoreDisplayMode.value = mode
      },

      // ========== 数据访问 ==========
      data: computed(() => currentUser.value?.binance || null),
      config: computed(() => {
        const binanceData = currentUser.value?.binance
        if (binanceData?.config) {
          document.documentElement.setAttribute('data-theme', binanceData.config.theme)
        }
        return binanceData?.config || null
      }),
      profitData: computed(() => currentUser.value?.binance?.date || []),

      // ========== 方法 ==========
      updateUserConfigAction: async ({ configKey, configValue, name, action }: { configKey: string, configValue: any, name: string, action: string }) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 获取旧配置（深拷贝，避免引用被修改）
          const oldConfig = JSON.parse(JSON.stringify((currentUser.value.binance.config as any)[configKey]))

          // 更新本地配置
          if (currentUser.value?.binance) {
            (currentUser.value.binance.config as any)[configKey] = configValue
          }

          // 准备日志信息
          const logEntry = {
            action: action,
            type: 'editConfig' as 'editConfig',
            details: JSON.stringify({
              oldData: { type: configKey, value: oldConfig, name: name },
              newData: { type: configKey, value: configValue, name: name },
            }),
          }

          // 调用 API 更新
          await apiModule.updateData(logEntry, 'binance')
        } catch (error) {
          console.error('❌ Binance 配置更新失败:', error)
          throw error
        }
      },

      updateUserConfigsAction: async (configs: Record<string, any>) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 获取旧配置（深拷贝，避免引用被修改）
          const oldConfig = JSON.parse(JSON.stringify(currentUser.value.binance.config))

          // 更新本地配置
          currentUser.value.binance.config = { ...currentUser.value.binance.config, ...configs }

          // 准备日志详情
          const logDetails = {
            oldData: oldConfig,
            newData: configs,
          }

          // 准备日志信息
          const logEntry = {
            action: '批量修改配置',
            type: 'editConfigs' as 'editConfigs',
            details: JSON.stringify(logDetails),
          }

          // 调用 API 更新
          await apiModule.updateData(logEntry, 'binance')

        } catch (error) {
          console.error('❌ Binance 批量配置更新失败:', error)
          throw error
        }
      },
    },

    okx: {
      data: computed(() => currentUser.value?.okx || null),
      config: computed(() => currentUser.value?.okx?.config || null),
      profitData: computed(() => currentUser.value?.okx?.date || []),


      // ========== 方法 ==========
      updateUserConfigAction: async ({ configKey, configValue, name, action }: { configKey: string, configValue: any, name: string, action: string }) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 获取旧配置（深拷贝，避免引用被修改）
          const oldConfig = JSON.parse(JSON.stringify((currentUser.value.okx.config as any)[configKey]))

          // 更新本地配置
          if (currentUser.value?.okx) {
            (currentUser.value.okx.config as any)[configKey] = configValue
          }

          // 准备日志信息
          const logEntry = {
            action: action,
            type: 'editConfig' as 'editConfig',
            details: JSON.stringify({
              oldData: { type: configKey, value: oldConfig, name: name },
              newData: { type: configKey, value: configValue, name: name },
            }),
          }

          // 调用 API 更新
          await apiModule.updateData(logEntry, 'okx')
        } catch (error) {
          console.error('❌ OKX 配置更新失败:', error)
          throw error
        }
      },

      updateUserConfigsAction: async (configs: Record<string, any>) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 获取旧配置（深拷贝，避免引用被修改）
          const oldConfig = JSON.parse(JSON.stringify(currentUser.value.okx.config))

          // 更新本地配置
          if (currentUser.value?.okx) {
            currentUser.value.okx.config = { ...currentUser.value.okx.config, ...configs }
          }

          // 准备日志详情
          const logDetails = {
            oldData: oldConfig,
            newData: configs,
          }

          // 准备日志信息
          const logEntry = {
            action: '批量修改配置',
            type: 'editConfigs' as 'editConfigs',
            details: JSON.stringify(logDetails),
          }

          // 调用 API 更新
          await apiModule.updateData(logEntry, 'okx')

        } catch (error) {
          console.error('❌ OKX 批量配置更新失败:', error)
          throw error
        }
      }
    }
  }

  // ========== 日志模块 ==========
  const logModule = {
    // 创建日志条目
    createLogEntry: async (
      platform: 'binance' | 'okx',
      action: string,
      type: 'addRecord' | 'editRecord' | 'clearRecord' | 'editConfigs' | 'editConfig',
      details?: string,
    ): Promise<void> => {
      if (!currentUser.value) throw new Error('用户不存在')

      const ip = await getUserIP()
      const platformData = currentUser.value[platform]

      if (!platformData.log) {
        platformData.log = []
      }

      const maxId = platformData.log.length > 0 ? Math.max(...platformData.log.map((log) => log.id)) : 0

      const logEntry: LogEntry = {
        id: maxId + 1,
        timestamp: Date.now(),
        action,
        type,
        details,
        ip,
      }

      platformData.log.unshift(logEntry)
    },

    // 清空日志
    clearLogs: async (platform: 'binance' | 'okx') => {
      if (!currentUser.value) return

      try {
        const platformData = currentUser.value[platform]
        if (platformData) {
          platformData.log = []
          console.log(`✅ ${platform} 日志清空成功`)
        }
        await apiModule.updateData()
      } catch (error) {
        console.error(`❌ ${platform} 日志清空失败:`, error)
      }
    }
  }

  // ========== API 更新模块 ==========
  const apiModule = {
    // 获取数据
    fetchData: async (hasUser: string | null = null) => {
      try {
        const data = await fetchDataFromAPI()
        profitData.value = data

        if (hasUser) {
          toggleUser(hasUser)
          return
        }

        if (profitData.value) {
          const availableUsers = Object.keys(profitData.value.data)
          if (availableUsers.length > 0) {
            const firstUserId = availableUsers[0]
            toggleUser(firstUserId)
          }
        }
      } catch (error) {
        console.error('❌ 数据更新失败:', error)
      }
    },

    // 更新数据
    updateData: async (logEntry?: { action: string; type: 'addRecord' | 'editRecord' | 'clearRecord' | 'editConfigs' | 'editConfig'; details?: string }, platform: 'binance' | 'okx' = 'binance') => {
      // 如果提供了日志信息，先在内存中添加日志
      if (logEntry && currentUser.value) {
        try {
          await logModule.createLogEntry(platform, logEntry.action, logEntry.type, logEntry.details)
        } catch (error) {
          console.error('❌ 日志记录失败:', error)
        }
      }

      // 调用 API 更新数据
      const res = await updateDataInAPI(profitData.value)
      return res
    }
  }

  return {
    // 全局状态
    profitData,
    currentUser,
    currentUserName,
    availableUsers,

    // 平台模块
    binance: platformModules.binance,
    okx: platformModules.okx,

    // 日志模块
    log: logModule,

    // API 模块
    api: apiModule,

    // 方法
    toggleUser,
  }
})