import { createRouter, createWebHistory } from 'vue-router'
import Binance from '@/views/Binance.vue'
import Bot from '@/views/Bot.vue'
import OKX from '@/views/OKX.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
  ],
})

export default router
