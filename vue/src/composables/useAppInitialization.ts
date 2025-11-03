import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'
import { useTaskManagement } from '@/composables/useTaskManagement'

export function useAppInitialization() {
  const appStore = useAppStore()
  const { withLoading } = useLoading()
  const { checkAndGenerateTodayTasks } = useTaskManagement()

  // 定时器引用
  const refreshTimer = ref<number | null>(null)
  const dateCheckTimer = ref<number | null>(null)
  const lastCheckedDateKey = ref<number | null>(null)

  // 初始化应用数据（静默加载，不显示弹窗）
  const initializeApp = async () => {
    try {
      await appStore.api.fetchData()
      // 数据加载后检查并生成今天的任务
      await checkDateChange()
    } catch (error) {
      console.error('数据加载失败:', error)
    }
  }

  // 检查日期是否变化
  const checkDateChange = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = Math.floor(today.getTime() / (24 * 60 * 60 * 1000))

    // 如果是第一次检查，记录日期
    if (lastCheckedDateKey.value === null) {
      lastCheckedDateKey.value = todayKey
      return
    }

    // 如果日期变化了，生成新任务
    if (lastCheckedDateKey.value !== todayKey) {
      console.log('📅 检测到日期变化，重新生成今天的任务...')
      lastCheckedDateKey.value = todayKey
      await checkAndGenerateTodayTasks()
    }
  }

  // 启动定时器
  const startRefreshTimer = (intervalMinutes: number = 10) => {
    // 清除现有定时器
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
    }
    if (dateCheckTimer.value) {
      clearInterval(dateCheckTimer.value)
    }

    // 初始化日期检查
    checkDateChange()

    // 设置定时器 (intervalMinutes * 60 * 1000 毫秒)
    refreshTimer.value = setInterval(
      async () => {
        console.log('🔄 定时器触发，开始更新数据...')
        await appStore.api.fetchData()
        // 刷新数据后检查日期变化
        await checkDateChange()
      },
      intervalMinutes * 60 * 1000,
    )

    // 每分钟检查一次日期变化（用于检测凌晨时间切换）
    dateCheckTimer.value = setInterval(
      async () => {
        await checkDateChange()
      },
      60 * 1000, // 每分钟检查一次
    )

    console.log(`⏰ 定时器已启动，每${intervalMinutes}分钟更新一次数据，每分钟检查日期变化`)
  }

  // 停止定时器
  const stopRefreshTimer = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
    if (dateCheckTimer.value) {
      clearInterval(dateCheckTimer.value)
      dateCheckTimer.value = null
    }
    console.log('⏹️ 定时器已停止')
  }

  // 重启定时器
  const restartRefreshTimer = (intervalMinutes: number = 10) => {
    stopRefreshTimer()
    startRefreshTimer(intervalMinutes)
  }

  // 手动刷新数据
  const refreshData = async () => {
    try {
      await withLoading(async () => {
        await appStore.api.fetchData()
      }, '刷新数据中...')
    } catch (error) {
      console.error('数据刷新失败:', error)
    }
  }

  // 页面挂载时的初始化
  const onPageMount = (intervalMinutes: number = 10) => {
    onMounted(() => {
      initializeApp()
      startRefreshTimer(intervalMinutes)
    })
  }

  // 页面卸载时的清理
  const onPageUnmount = () => {
    onUnmounted(() => {
      stopRefreshTimer()
    })
  }

  // 完整的生命周期管理
  const setupAppLifecycle = (intervalMinutes: number = 10) => {
    onPageMount(intervalMinutes)
    onPageUnmount()
  }

  return {
    // 状态
    refreshTimer,

    // 方法
    initializeApp,
    startRefreshTimer,
    stopRefreshTimer,
    restartRefreshTimer,
    refreshData,

    // 生命周期
    onPageMount,
    onPageUnmount,
    setupAppLifecycle,
  }
}
