/*
  파일명: src/router/index.js

  역할:
  - 테라리아 표준시간 비서 스케줄러 라우터입니다.
  - 기존 운영/차량/관리 구조를 제거하고 새 메뉴만 사용합니다.
*/

import { createRouter, createWebHashHistory } from 'vue-router'

import HeadquartersView from '../views/HeadquartersView.vue'
import SecretaryOfficeView from '../views/SecretaryOfficeView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import ProgressView from '../views/ProgressView.vue'
import FamilyView from '../views/FamilyView.vue'

const routes = [
  {
    path: '/',
    redirect: '/headquarters',
  },
  {
    path: '/headquarters',
    name: 'headquarters',
    component: HeadquartersView,
  },
  {
    path: '/secretary-office',
    name: 'secretary-office',
    component: SecretaryOfficeView,
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleView,
  },
  {
    path: '/progress',
    name: 'progress',
    component: ProgressView,
  },
  {
    path: '/family',
    name: 'family',
    component: FamilyView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
