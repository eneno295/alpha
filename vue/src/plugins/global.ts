import { ref } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { createApp } from 'vue'
import Toast from '@/components/common/Toast.vue'

// 全局状态
const toastState = ref({
  visible: false,
  type: 'info' as 'success' | 'error' | 'warning' | 'info',
  title: '',
  message: '',
  duration: 3000,
})

// Toast 队列管理
const toastQueue: Array<typeof toastState.value> = []
let isShowingToast = false

// 获取全局加载状态
const { showLoadingState, hideLoadingState, withLoading } = useLoading()

// 初始化全局组件
const initGlobalComponents = () => {
  // 创建 Toast 容器
  if (!document.getElementById('global-toast-container')) {
    const toastContainer = document.createElement('div')
    toastContainer.id = 'global-toast-container'
    document.body.appendChild(toastContainer)
  }
}

// Toast 相关方法
const showToast = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string,
  duration?: number,
) => {
  const toastData = {
    visible: true,
    type,
    title,
    message: message || '',
    duration: duration || 3000,
  }

  if (isShowingToast) {
    // 如果正在显示 Toast，加入队列
    toastQueue.push(toastData)
  } else {
    // 直接显示
    displayToast(toastData)
  }
}

const displayToast = (toastData: typeof toastState.value) => {
  isShowingToast = true

  // 更新响应式状态
  toastState.value = { ...toastData }

  // 使用 Vue 组件渲染 Toast
  const container = document.getElementById('global-toast-container')
  if (container) {
    const toastDiv = document.createElement('div')
    container.appendChild(toastDiv)

    const app = createApp(Toast, {
      visible: toastData.visible,
      type: toastData.type,
      title: toastData.title,
      message: toastData.message,
      duration: toastData.duration,
      onClose: () => {
        app.unmount()
        toastDiv.remove()
        handleToastClose()
      },
    })

    app.mount(toastDiv)

    // 自动关闭
    if (toastData.duration > 0) {
      setTimeout(() => {
        if (toastDiv.parentNode) {
          app.unmount()
          toastDiv.remove()
          handleToastClose()
        }
      }, toastData.duration)
    }
  }
}

const handleToastClose = () => {
  toastState.value.visible = false
  isShowingToast = false

  // 显示队列中的下一个 Toast
  if (toastQueue.length > 0) {
    const nextToast = toastQueue.shift()!
    setTimeout(() => {
      displayToast(nextToast)
    }, 300) // 等待动画完成
  }
}

// Loading 相关方法
const showLoading = (message?: string) => {
  showLoadingState(message)
}

const hideLoading = () => {
  hideLoadingState()
}

// 全局插件对象
const GlobalPlugin = {
  // Toast 方法
  toast: {
    success: (title: string, message?: string, duration?: number) => showToast('success', title, message, duration),
    error: (title: string, message?: string, duration?: number) => showToast('error', title, message, duration),
    warning: (title: string, message?: string, duration?: number) => showToast('warning', title, message, duration),
    info: (title: string, message?: string, duration?: number) => showToast('info', title, message, duration)
  },

  // Loading 方法
  loading: {
    show: (message?: string) => showLoading(message),
    hide: () => hideLoading(),
    withLoading: <T>(asyncFn: () => Promise<T>, message?: string) => withLoading(asyncFn, message)
  },

  // 初始化方法
  init: initGlobalComponents
}

// 导出插件
export default GlobalPlugin

// 导出到全局
if (typeof window !== 'undefined') {
  window.GlobalPlugin = GlobalPlugin
}

// 声明全局类型
declare global {
  interface Window {
    GlobalPlugin: typeof GlobalPlugin
  }
}