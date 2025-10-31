import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProfitData, UserData, LogEntry, AddLog, Platform, LogType, TaskData, TaskTemplate, TaskDateRecord, DailyTaskItem } from '@/types'
import { updateDataInAPI, getUserIP, fetchDataFromAPI } from '@/api'
import router from '@/router'

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

  // 获取当前平台
  const getPlatform = (): Platform => {
    return (router.currentRoute.value.name as Platform) || 'binance'
  }

  // ===== 平台内存态（用于功能开关：binance 与 gate 复用组件） =====
  const binanceOpenSimulation = ref(false)
  const binanceScoreDisplayMode = ref<'current' | 'today' | 'add'>('current')
  const gateOpenSimulation = ref(false)
  const gateScoreDisplayMode = ref<'current' | 'today' | 'add'>('current')

  // ========== 平台数据模块 ==========
  const platformModules = {
    binance: {
      // ========== Binance 特有功能 ==========
      // 模拟积分（根据当前路由动态切换 binance/gate 的内存态）
      openSimulation: computed(() =>
        getPlatform() === 'gate' ? gateOpenSimulation.value : binanceOpenSimulation.value,
      ),
      // 积分显示模式（根据当前路由动态切换）
      scoreDisplayMode: computed(() =>
        getPlatform() === 'gate' ? gateScoreDisplayMode.value : binanceScoreDisplayMode.value,
      ),
      // 切换模拟积分按钮显示状态
      toggleSimulation: () => {
        if (getPlatform() === 'gate') {
          gateOpenSimulation.value = !gateOpenSimulation.value
        } else {
          binanceOpenSimulation.value = !binanceOpenSimulation.value
        }
      },
      // 设置积分显示模式
      setScoreDisplayMode: (mode: 'current' | 'today' | 'add') => {
        if (getPlatform() === 'gate') {
          gateScoreDisplayMode.value = mode
        } else {
          binanceScoreDisplayMode.value = mode
        }
      },

      // ========== 数据访问 ==========
      // 当路由在 gate 时，复用 binance 组件，但数据来自 gate
      data: computed(() => {
        const platform = getPlatform()
        const source = platform === 'gate' ? (currentUser.value as any)?.gate : currentUser.value?.binance
        return source || null
      }),
      config: computed(() => {
        const platform = getPlatform()
        const source = platform === 'gate' ? (currentUser.value as any)?.gate : currentUser.value?.binance
        const cfg = source?.config
        if (cfg) {
          document.documentElement.setAttribute('data-theme', cfg.theme || 'light')
        }
        return cfg || null
      }),
      profitData: computed(() => {
        const platform = getPlatform()
        const source = platform === 'gate' ? (currentUser.value as any)?.gate : currentUser.value?.binance
        return source?.date || []
      }),
      logs: computed(() => {
        const platform = getPlatform()
        const source = platform === 'gate' ? (currentUser.value as any)?.gate : currentUser.value?.binance
        return source?.log || []
      }),

      // ========== 方法 ==========
      updateUserConfigAction: async ({ configKey, configValue, name, action }: { configKey: string, configValue: any, name: string, action: string }) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          const platform = getPlatform()
          const targetModule = platform === 'gate' ? 'gate' : 'binance'

          // 获取旧配置（深拷贝，避免引用被修改）
          const oldConfig = JSON.parse(
            JSON.stringify(((currentUser.value as any)[targetModule].config as any)[configKey]),
          )

          // 更新本地配置
          if ((currentUser.value as any)?.[targetModule]) {
            ((currentUser.value as any)[targetModule].config as any)[configKey] = configValue
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

          // 更新日志
          await logModule.createLogEntry(logEntry)
          // 更新数据
          await apiModule.updateData()
        } catch (error) {
          console.error('❌ Binance 配置更新失败:', error)
          throw error
        }
      },

      // 批量更新配置（带日志与持久化），支持 gate 与 binance
      updateUserConfigsAction: async (configs: Record<string, any>) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          const platform = getPlatform()
          const targetModule = platform === 'gate' ? 'gate' : 'binance'

          // 旧配置
          const oldConfig = JSON.parse(JSON.stringify((currentUser.value as any)[targetModule].config))

            // 本地更新
            ; (currentUser.value as any)[targetModule].config = {
              ...(currentUser.value as any)[targetModule].config,
              ...configs,
            }

          // 日志
          await logModule.createLogEntry({
            action: '批量修改配置',
            type: 'editConfigs',
            details: JSON.stringify({ oldData: oldConfig, newData: configs }),
          })

          // 持久化
          await apiModule.updateData()
        } catch (error) {
          console.error('❌ Binance 批量配置更新失败:', error)
          throw error
        }
      }
    },

    okx: {
      data: computed(() => currentUser.value?.okx || null),
      config: computed(() => currentUser.value?.okx?.config || null),
      profitData: computed(() => {
        // 聚合所有账号的数据，转换为原来的格式以保持兼容性
        if (!currentUser.value?.okx?.accounts) return []

        const allRecords: any[] = []
        Object.entries(currentUser.value.okx.accounts).forEach(([account, accountData]) => {
          accountData.date.forEach((record: any) => {
            allRecords.push({
              ...record,
              account // 新增账号信息
            })
          })
        })

        // 按日期排序
        return allRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }),
      logs: computed(() => currentUser.value?.okx?.log || []),

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
            type: 'editConfig' as LogType,
            details: JSON.stringify({
              oldData: { type: configKey, value: oldConfig, name: name },
              newData: { type: configKey, value: configValue, name: name },
            }),
          }

          // 更新日志
          await logModule.createLogEntry(logEntry)
          // 更新数据
          await apiModule.updateData()
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
          await apiModule.updateData()
          // 更新日志
          await logModule.createLogEntry(logEntry)
        } catch (error) {
          console.error('❌ OKX 批量配置更新失败:', error)
          throw error
        }
      },

      // 更新记录数据（支持账号分组）
      updateRecordData: async (account: string, date: string, recordData: any) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 确保 accounts 结构存在
          if (!currentUser.value.okx.accounts) {
            currentUser.value.okx.accounts = {}
          }

          // 确保账号结构存在
          if (!currentUser.value.okx.accounts[account]) {
            currentUser.value.okx.accounts[account] = { date: [], order: 0 }
          }

          // 移除该日期的旧记录
          currentUser.value.okx.accounts[account].date = currentUser.value.okx.accounts[account].date.filter(
            (item: any) => item.date !== date
          )

          // 添加新记录
          currentUser.value.okx.accounts[account].date.push(recordData)

          // 排序
          currentUser.value.okx.accounts[account].date.sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )

        } catch (error) {
          console.error('❌ OKX 记录更新失败:', error)
          throw error
        }
      },

      // 清空记录
      clearRecord: async (account: string, date: string) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          if (currentUser.value.okx.accounts?.[account]) {
            currentUser.value.okx.accounts[account].date = currentUser.value.okx.accounts[account].date.filter(
              (item: any) => item.date !== date
            )
          }

        } catch (error) {
          console.error('❌ OKX 记录清空失败:', error)
          throw error
        }
      }
    },

    // ========== 任务模块 ==========
    tasks: {
      // 获取任务数据
      data: computed(() => {
        if (!currentUser.value || !currentUser.value.tasks) {
          return { tasks: [], date: [] }
        }
        return currentUser.value.tasks
      }),

      // 初始化任务数据
      initTaskData: () => {
        if (!currentUser.value) return
        if (!currentUser.value.tasks) {
          currentUser.value.tasks = {
            tasks: [],
            date: []
          }
        }
      },

      // 更新任务数据
      updateTaskData: async (taskData: TaskData) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          // 初始化任务数据结构（如果不存在）
          if (!currentUser.value.tasks) {
            currentUser.value.tasks = { tasks: [], date: [] }
          }

          // 更新任务数据
          currentUser.value.tasks = taskData

          // 保存到 API
          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 任务数据更新失败:', error)
          throw error
        }
      },

      // 添加任务模板
      addTemplate: async (template: TaskTemplate) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          platformModules.tasks.initTaskData()

          currentUser.value.tasks!.tasks.push(template)
          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 添加任务模板失败:', error)
          throw error
        }
      },

      // 更新任务模板
      updateTemplate: async (templateId: number, updates: Partial<TaskTemplate>) => {
        try {
          if (!currentUser.value || !currentUser.value.tasks) throw new Error('任务数据不存在')

          const template = currentUser.value.tasks.tasks.find(t => t.id === templateId)
          if (template) {
            Object.assign(template, updates)

            // 更新所有日期记录中的 detail 快照
            currentUser.value.tasks.date.forEach(record => {
              record.tasks.forEach(task => {
                if (task.taskId === templateId) {
                  task.detail = { ...template }
                }
              })
            })

            await apiModule.updateData()
          }
        } catch (error) {
          console.error('❌ 更新任务模板失败:', error)
          throw error
        }
      },

      // 删除任务模板
      deleteTemplate: async (templateId: number) => {
        try {
          if (!currentUser.value || !currentUser.value.tasks) throw new Error('任务数据不存在')

          // 删除模板
          currentUser.value.tasks.tasks = currentUser.value.tasks.tasks.filter(t => t.id !== templateId)

          // 获取今天0点的时间戳
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayTimestamp = today.getTime()

          // 只删除今天及未来日期记录中的相关任务，保留历史记录
          currentUser.value.tasks.date.forEach(record => {
            if (record.date >= todayTimestamp) {
              // 今天及未来的记录：删除该任务
              record.tasks = record.tasks.filter(t => t.taskId !== templateId)
            }
            // 历史记录：保留
          })

          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 删除任务模板失败:', error)
          throw error
        }
      },

      // 添加日期记录
      addDateRecord: async (dateRecord: TaskDateRecord) => {
        try {
          if (!currentUser.value) throw new Error('用户不存在')

          platformModules.tasks.initTaskData()

          currentUser.value.tasks!.date.push(dateRecord)
          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 添加日期记录失败:', error)
          throw error
        }
      },

      // 删除整天记录
      deleteDateRecord: async (dateRecordId: number) => {
        try {
          if (!currentUser.value || !currentUser.value.tasks) throw new Error('任务数据不存在')

          currentUser.value.tasks.date = currentUser.value.tasks.date.filter(r => r.id !== dateRecordId)

          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 删除日期记录失败:', error)
          throw error
        }
      },

      // 更新任务完成状态
      updateTaskCompletion: async (dateRecordId: number, taskId: number, completedAt?: number, remark?: string) => {
        try {
          if (!currentUser.value || !currentUser.value.tasks) throw new Error('任务数据不存在')

          const record = currentUser.value.tasks.date.find(r => r.id === dateRecordId)
          if (record) {
            const task = record.tasks.find(t => t.taskId === taskId)
            if (task) {
              if (completedAt) {
                task.completedAt = completedAt
                if (remark) {
                  task.remark = remark
                }
              } else {
                delete task.completedAt
                delete task.remark
              }
            }
          }

          await apiModule.updateData()
        } catch (error) {
          console.error('❌ 更新任务完成状态失败:', error)
          throw error
        }
      },
    }
  }

  // ========== 日志模块 ==========
  const logModule = {
    // 创建日志条目
    createLogEntry: async (addLog: AddLog): Promise<void> => {
      if (!currentUser.value) throw new Error('用户不存在')

      const { action, type, details } = addLog

      const ip = await getUserIP()
      const currentPlatform = getPlatform()
      const platformData = currentUser.value![currentPlatform]

      if (!platformData) throw new Error(`平台 ${currentPlatform} 数据不存在`)

      if (!platformData.log) {
        platformData.log = []
      }

      const maxId = platformData.log.length > 0 ? Math.max(...platformData.log.map((log: any) => log.id)) : 0

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
    clearLogs: async (platform: Platform) => {
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
        // 记录当前已选用户，刷新/切换路由时保持不变
        const prevUser = currentUserName.value

        const data = await fetchDataFromAPI()
        profitData.value = data

        // 如果显式指定用户，且该用户在新数据中存在，则切换后返回
        if (hasUser && profitData.value.data[hasUser]) {
          toggleUser(hasUser)
          return
        }

        // 优先保持之前选中的用户
        if (prevUser && profitData.value.data[prevUser]) {
          toggleUser(prevUser)
        } else if (profitData.value && profitData.value.users.length > 0) {
          const firstUserId = profitData.value.users[0]
          toggleUser(firstUserId)
        }
      } catch (error) {
        console.error('❌ 数据更新失败:', error)
      }
    },

    // 更新数据
    updateData: async () => {
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
    tasks: platformModules.tasks,

    // 日志模块
    log: logModule,

    // API 模块
    api: apiModule,

    // 方法
    toggleUser,
    getPlatform
  }
})