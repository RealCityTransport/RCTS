import { createRouter, createWebHashHistory } from 'vue-router'

import HeadquartersView from '../views/HeadquartersView.vue'
import VehiclesView from '../views/VehiclesView.vue'
import OperationsView from '../views/OperationsView.vue'
import RailView from '../views/RailView.vue'
import AviationView from '../views/AviationView.vue'
import SettlementView from '../views/SettlementView.vue'

const routes = [
  { path: '/', redirect: '/headquarters' },
  { path: '/headquarters', name: 'headquarters', component: HeadquartersView },
  { path: '/vehicles', name: 'vehicles', component: VehiclesView },
  { path: '/operations', name: 'operations', component: OperationsView },
  { path: '/rail', name: 'rail', component: RailView },
  { path: '/aviation', name: 'aviation', component: AviationView },
  { path: '/settlement', name: 'settlement', component: SettlementView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
