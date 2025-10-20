import { createRouter, createWebHashHistory } from 'vue-router'
import Binance from '@/views/Binance.vue'
import Bot from '@/views/Bot.vue'
import OKX from '@/views/OKX.vue'
import Gate from '@/views/Gate.vue'

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
  ],
})

export default router
