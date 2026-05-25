// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

import PlayPage from '@/components/PlayPage.vue'

const router = createRouter({
  history: createWebHashHistory(),

  routes: [
    {
      path: '/',
      component: PlayPage,
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router