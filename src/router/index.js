/*
  파일명: src/router/index.js

  역할:
  - Vue Router 설정 파일입니다.
  - App.vue의 3개 메뉴와 실제 페이지 컴포넌트를 연결합니다.

  경로:
  /operations : 운영 슬롯
  /vehicles   : 차량 구입
  /research   : 연구

  참고:
  - GitHub Pages 배포를 고려해 createWebHashHistory()를 사용합니다.
  - / 접속 시 /operations로 자동 이동합니다.
*/

import { createRouter, createWebHashHistory } from 'vue-router'

import OperationsView from '../views/OperationsView.vue'
import VehiclesView from '../views/VehiclesView.vue'
import ResearchView from '../views/ResearchView.vue'

const routes = [
  {
    path: '/',
    redirect: '/operations',
  },
  {
    path: '/operations',
    name: 'operations',
    component: OperationsView,
  },
  {
    path: '/vehicles',
    name: 'vehicles',
    component: VehiclesView,
  },
  {
    path: '/research',
    name: 'research',
    component: ResearchView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router