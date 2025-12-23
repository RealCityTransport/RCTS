// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import ResearchView from '../views/ResearchView.vue'
import VehiclesView from '../views/VehiclesView.vue'
import LineView from '../views/LineView.vue'
import ConstructionView from '../views/ConstructionView.vue'
import FinanceView from '../views/FinanceView.vue'
import CityView from '../views/CityView.vue'

import SettingsView from '../views/settings/SettingsView.vue'
import DataManagerView from '../views/settings/DataManagerView.vue'
import PreviewRunsView from '../views/PreviewRunsView.vue'

const routes = [
  { path: '/', redirect: '/home/research' },
  {
    path: '/home',
    component: HomeView,
    children: [
      { path: '', redirect: '/home/research' },

      { path: 'preview', name: 'PreviewRuns', component: PreviewRunsView },
      { path: 'research', name: 'Research', component: ResearchView },
      { path: 'vehicles', name: 'Vehicles', component: VehiclesView },
      { path: 'line', name: 'Line', component: LineView },
      { path: 'construction', name: 'Construction', component: ConstructionView },
      { path: 'finance', name: 'Finance', component: FinanceView },
      { path: 'city', name: 'City', component: CityView },

      {
        path: 'settings',
        component: SettingsView,
        children: [
          { path: '', redirect: { name: 'DataManager' } },
          { path: 'data', name: 'DataManager', component: DataManagerView },
        ],
      },
    ],
  },
]

const router = createRouter({
  // ✅ 중요: 채널별 base에 맞춰 History 생성
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
