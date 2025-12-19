// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import TheLayout from '@/views/TheLayout.vue'
import OverviewPage from '@/views/game/overview/OverviewPage.vue' // 초기 대시보드 페이지
import NotFoundView from '@/views/NotFoundView.vue' // 404 페이지
import DataArchivePage from '@/views/DataArchivePage.vue'; // 자료실 페이지
import LoginPage from '@/views/LoginPage.vue'; // 로그인 페이지

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: TheLayout,
      children: [
        {
          path: '', // 루트 경로로 접근 시 OverviewPage를 TheLayout 안에 렌더링
          name: 'Overview',
          component: OverviewPage
        },
        {
          path: 'data-archive', // ⭐⭐⭐ 자료실 경로 추가 ⭐⭐⭐
          name: 'DataArchive',
          component: DataArchivePage,
        },
        {
          path: 'login', // ⭐⭐ 로그인 페이지 경로 추가! ⭐⭐
          name: 'Login',
          component: LoginPage,
        },
        // 이후 추가될 게임의 다른 페이지들은 여기에 children으로 추가됩니다.
        // {
        //   path: 'transport',
        //   name: 'transport-center',
        //   component: () => import('@/views/game/transport/TransportCenter.vue')
        // },
        // ...
      ]
    },
    // 모든 다른 경로에 대한 404 처리 (전역 404)
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

export default router