// 全局样式
import '@/assets/css/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import GlobalPlugin from '@/plugins/global'
import { useAppStore } from '@/stores/app'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)


// 路由变化时（含同页 query 变更）刷新数据源并拉取数据
const appStore = useAppStore()
// 记录上一次的地址栏参数
let lastQueryString = window.location.hash.split('?')[1] || ''

router.afterEach(() => {
  // 获取当前的所有地址栏参数（从 hash 模式的 URL 中提取）
  const currentQueryString = window.location.hash.split('?')[1] || ''

  // 只有地址栏参数发生变化时才重新拉取数据
  if (currentQueryString !== lastQueryString) {
    lastQueryString = currentQueryString
    // 传递当前已选用户名，保证数据加载后仍然选中同一用户
    appStore.api.fetchData(appStore.currentUserName)
  }
})

// 初始化全局插件
GlobalPlugin.init()

app.mount('#app')

