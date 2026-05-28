// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router'

import HomePage from '../pages/HomePage.vue'
import SystemPage from '../pages/SystemPage.vue'
import StaffPage from '../pages/StaffPage.vue'
import TransportPage from '../pages/TransportPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/system',
    name: 'system',
    component: SystemPage,
  },
  {
    path: '/staff',
    name: 'staff',
    component: StaffPage,
  },
  {
    path: '/transport',
    name: 'transport',
    component: TransportPage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router