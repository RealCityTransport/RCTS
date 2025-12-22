// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';                 // 전체 레이아웃
import ResearchView from '../views/ResearchView.vue';         // 연구
import VehiclesView from '../views/VehiclesView.vue';         // 차량
import LineView from '../views/LineView.vue';                 // 노선
import ConstructionView from '../views/ConstructionView.vue'; // 건설
import FinanceView from '../views/FinanceView.vue';           // 재정
import CityView from '../views/CityView.vue';                 // 도시

import SettingsView from '../views/settings/SettingsView.vue';
import DataManagerView from '../views/settings/DataManagerView.vue';

// ✅ 신규: 모바일에서 "프리뷰 운행"을 센터 메인컨텐츠로 보여줄 전용 View
import PreviewRunsView from '../views/PreviewRunsView.vue';

const routes = [
  {
    path: '/',
    redirect: '/home/research',
  },
  {
    path: '/home',
    component: HomeView,
    children: [
      {
        path: '',
        redirect: '/home/research',
      },

      // ✅ 신규: 프리뷰 운행
      {
        path: 'preview',
        name: 'PreviewRuns',
        component: PreviewRunsView,
      },

      {
        path: 'research',
        name: 'Research',
        component: ResearchView,
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: VehiclesView,
      },
      {
        path: 'line',
        name: 'Line',
        component: LineView,
      },
      {
        path: 'construction',
        name: 'Construction',
        component: ConstructionView,
      },
      {
        path: 'finance',
        name: 'Finance',
        component: FinanceView,
      },
      {
        path: 'city',
        name: 'City',
        component: CityView,
      },
      {
        path: 'settings',
        component: SettingsView,
        children: [
          {
            path: '',
            redirect: { name: 'DataManager' },
          },
          {
            path: 'data',
            name: 'DataManager',
            component: DataManagerView,
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
