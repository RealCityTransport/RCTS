// src/router/index.js (또는 src/router.js)

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue'; // 전체 레이아웃
import ResearchView from '../views/ResearchView.vue'; // 연구
import VehiclesView from '../views/VehiclesView.vue';
import LineView from '../views/LineView.vue'; // 노선 (새로 추가)
import ConstructionView from '../views/ConstructionView.vue'; // 건설 (새로 추가)
import FinanceView from '../views/FinanceView.vue'; // 재정 (새로 추가)


const routes = [
  {
    path: '/',
    redirect: '/home/research', // 🔥 루트 경로로 오면 /home/research로 바로 리다이렉트 🔥
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView, // HomeView가 최상위 레이아웃을 담당
    children: [ // 중첩 라우트 정의
      // /home 경로에 바로 접속했을 때 /home/research로 리다이렉트
      { path: '', redirect: 'research' }, // 🔥 /home으로 들어오면 자동으로 /home/research로 🔥
      {
        path: 'research', // /home/research
        name: 'Research',
        component: ResearchView,
      },
      {
        path: 'vehicles', // 🔥 /home/vehicles
        name: 'Vehicles',
        component: VehiclesView,
     },
      {
        path: 'line', // /home/line
        name: 'Line',
        component: LineView,
      },
      {
        path: 'construction', // /home/construction
        name: 'Construction',
        component: ConstructionView,
      },
      {
        path: 'finance', // /home/finance
        name: 'Finance',
        component: FinanceView,
      },
    ],
  },
  // 다른 최상위 라우트들 (예: /login, /settings 등)은 여기에 추가
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;