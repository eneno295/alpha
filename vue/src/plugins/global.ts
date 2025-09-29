import { ref } from 'vue'
import { useLoading } from '@/composables/useLoading'

// 全局状态
const toastState = ref({
  visible: false,
  type: 'info' as 'success' | 'error' | 'warning' | 'info',
  title: '',
  message: '',
  duration: 3000
})

// Toast 队列管理
const toastQueue: Array<typeof toastState.value> = []
let isShowingToast = false

// 获取全局加载状态
const { showLoadingState, hideLoadingState, withLoading } = useLoading()

// 初始化全局组件
const initGlobalComponents = () => {
  // 创建 Toast 容器
  if (!document.getElementById('global-toast')) {
    const toastContainer = document.createElement('div')
    toastContainer.id = 'global-toast'
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)

    // 简单的 DOM 操作方式
    const createToastElement = (toastData: typeof toastState.value) => {
      const toastEl = document.createElement('div')
      toastEl.className = `toast toast-${toastData.type}`
      toastEl.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 16px;
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        margin-bottom: 10px;
        border-left: 4px solid ${toastData.type === 'success' ? 'var(--success)' : toastData.type === 'error' ? 'var(--error)' : toastData.type === 'warning' ? 'var(--warning)' : 'var(--primary)'};
      `
      toastEl.innerHTML = `
        <div class="toast-icon" style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">
          <span>${toastData.type === 'success' ? '✅' : toastData.type === 'error' ? '❌' : toastData.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        </div>
        <div class="toast-content" style="flex: 1;">
          <div class="toast-title" style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${toastData.title}</div>
          ${toastData.message ? `<div class="toast-message" style="font-size: 14px; color: var(--text-secondary); line-height: 1.4;">${toastData.message}</div>` : ''}
        </div>
        <button class="toast-close" style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease; flex-shrink: 0;">×</button>
      `

      // 添加关闭事件
      const closeBtn = toastEl.querySelector('.toast-close')
      closeBtn?.addEventListener('click', () => {
        toastEl.remove()
        handleToastClose()
      })

      // 自动关闭
      if (toastData.duration > 0) {
        setTimeout(() => {
          if (toastEl.parentNode) {
            toastEl.remove()
            handleToastClose()
          }
        }, toastData.duration)
      }

      return toastEl
    }

      // 存储创建函数供后续使用
      ; (toastContainer as any).createToast = createToastElement
  }
}

// Toast 相关方法
const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number) => {
  const toastData = {
    visible: true,
    type,
    title,
    message: message || '',
    duration: duration || 3000
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
  toastState.value.visible = toastData.visible
  toastState.value.type = toastData.type
  toastState.value.title = toastData.title
  toastState.value.message = toastData.message
  toastState.value.duration = toastData.duration

  // 简单的 DOM 操作
  const toastContainer = document.getElementById('global-toast')
  if (toastContainer && (toastContainer as any).createToast) {
    const toastEl = (toastContainer as any).createToast(toastData)
    toastContainer.appendChild(toastEl)
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