import { createRouter, createWebHistory } from 'vue-router'
import Profit from '@/views/Profit.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Profit,
    },
  ],
})

export default router
