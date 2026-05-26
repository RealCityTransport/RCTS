// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

import PlayPage from '@/components/PlayPage.vue'

const router = createRouter({
  history: createWebHashHistory(),

  routes: [
    {
      path: '/',
      name: 'Home',
      component: PlayPage,
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],

  scrollBehavior() {
    return { top: 0 }
  },
})

export default router