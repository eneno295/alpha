// 全局样式
import '@/assets/css/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import GlobalPlugin from '@/plugins/global'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化全局插件
GlobalPlugin.init()

app.mount('#app')
