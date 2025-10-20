import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'

export function useAppInitialization() {
  const appStore = useAppStore()
  const { withLoading } = useLoading()

  // 定时器引用
  const refreshTimer = ref<number | null>(null)

  // 初始化应用数据
  const initializeApp = async () => {
    try {
      await withLoading(async () => {
        await appStore.api.fetchData()
      }, '加载数据中...')
    } catch (error) {
      console.error('数据加载失败:', error)
    }
  }

  // 启动定时器
  const startRefreshTimer = (intervalMinutes: number = 10) => {
    // 清除现有定时器
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
    }

    // 设置定时器 (intervalMinutes * 60 * 1000 毫秒)
    refreshTimer.value = setInterval(
      () => {
        console.log('🔄 定时器触发，开始更新数据...')
        appStore.api.fetchData()
      },
      intervalMinutes * 60 * 1000,
    )

    console.log(`⏰ 定时器已启动，每${intervalMinutes}分钟更新一次数据`)
  }

  // 停止定时器
  const stopRefreshTimer = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
      console.log('⏹️ 定时器已停止')
    }
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
