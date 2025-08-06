import { ref } from 'vue'

// 全局加载状态
const globalIsLoading = ref(false)
const globalLoadingMessage = ref('加载数据中...')

// 加载状态管理
export function useLoading() {
  // 显示加载状态
  const showLoadingState = (message?: string) => {
    globalIsLoading.value = true
    if (message) {
      globalLoadingMessage.value = message
    }
  }

  // 隐藏加载状态
  const hideLoadingState = () => {
    globalIsLoading.value = false
  }

  return {
    isLoading: globalIsLoading,
    loadingMessage: globalLoadingMessage,
    showLoadingState,
    hideLoadingState
  }
} 