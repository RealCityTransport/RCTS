import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue'; // HomeView 컴포넌트 임포트

const routes = [
  {
    path: '/', // 기본 경로 (예: yourdomain.com/)
    name: 'Home', // 라우트 이름 (선택 사항이지만 유용함)
    component: HomeView, // 연결할 컴포넌트
  },
  // 여기에 다른 페이지 라우트들을 추가할 수 있습니다.
  // {
  //   path: '/about',
  //   name: 'About',
  //   component: () => import('../views/AboutView.vue'), // 필요한 경우 지연 로딩
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 History 모드 사용 (깔끔한 URL)
  routes, // 위에서 정의한 라우트들을 등록
});

export default router; // 라우터 인스턴스를 내보냅니다.