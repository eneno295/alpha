import { createRouter, createWebHistory } from 'vue-router'
import Profit from '@/views/Profit.vue'
import Bot from '@/views/Bot.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Profit,
    },
    {
      path: '/bot',
      name: 'bot',
      component: Bot,
    },
  ],
})

export default router
