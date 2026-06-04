/*
  파일 주소:
  src/router/index.js

  적용 내용:
  - RCTS 페이지 라우팅 관리
  - 헤더 메뉴 클릭 시 각 View.vue 페이지가 RouterView에 로드되도록 설정
  - GitHub Pages 배포 안정성을 위해 createWebHashHistory 사용

  연결된 파일:
  - src/main.js
  - src/App.vue
  - src/components/layout/RctsHeader.vue
  - src/views/Home.vue
  - src/views/BusView.vue
  - src/views/RailView.vue
  - src/views/AirView.vue
  - src/views/ShipView.vue
  - src/views/SpaceView.vue
  - src/views/ResearchView.vue
  - src/views/SettingsView.vue

  수정 시 주의:
  - 새 메뉴 페이지가 생기면 routes 배열과 RctsHeader.vue의 navItems를 같이 수정
*/

import { createRouter, createWebHashHistory } from 'vue-router'

import HomeView from '../views/Home.vue'
import BusView from '../views/BusView.vue'
import RailView from '../views/RailView.vue'
import AirView from '../views/AirView.vue'
import ShipView from '../views/ShipView.vue'
import SpaceView from '../views/SpaceView.vue'
import ResearchView from '../views/ResearchView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/bus',
    name: 'bus',
    component: BusView
  },
  {
    path: '/rail',
    name: 'rail',
    component: RailView
  },
  {
    path: '/air',
    name: 'air',
    component: AirView
  },
  {
    path: '/ship',
    name: 'ship',
    component: ShipView
  },
  {
    path: '/space',
    name: 'space',
    component: SpaceView
  },
  {
    path: '/research',
    name: 'research',
    component: ResearchView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router