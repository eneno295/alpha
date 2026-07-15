import { createRouter, createWebHashHistory } from 'vue-router'
import Binance from '@/views/alpha/Binance.vue'
import Bot from '@/views/Bot.vue'
import OKX from '@/views/alpha/OKX.vue'
import Tasks from '@/views/Tasks.vue'
import Income from '@/views/income/index.vue'
import History from '@/views/history/index.vue'
import Monopoly from '@/views/monopoly/index.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'income',
      component: Income,
    },
    {
      path: '/binance',
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
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
    },
    {
      path: '/history',
      name: 'history',
      component: History,
    },
    {
      path: '/monopoly',
      name: 'monopoly',
      component: Monopoly,
    },
  ],
})

export default router
