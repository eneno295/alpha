import { createRouter, createWebHashHistory } from 'vue-router'
import Binance from '@/views/Binance.vue'
import Bot from '@/views/Bot.vue'
import OKX from '@/views/OKX.vue'
import Gate from '@/views/Gate.vue'
import Tasks from '@/views/Tasks.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'binance',
      component: Binance,
    },
    {
      path: '/bot',
      name: 'bot',
      component: Bot,
    },
    {
      path: '/okx',
      name: 'okx',
      component: OKX,
    },
    {
      path: '/gate',
      name: 'gate',
      component: Gate,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
    },
  ],
})

export default router
