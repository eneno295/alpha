import { createRouter, createWebHistory } from 'vue-router'
import Bot from '@/views/Bot.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'bot',
      component: Bot,
    },
  ],
})

export default router 