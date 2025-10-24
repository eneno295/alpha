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
router.afterEach(() => {
  // 传递当前已选用户名，保证数据加载后仍然选中同一用户
  appStore.api.fetchData(appStore.currentUserName)
})

// 初始化全局插件
GlobalPlugin.init()

app.mount('#app')

