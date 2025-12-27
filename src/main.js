// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// 🔥 이게 꼭 있어야 .mobile-only / .desktop-only 가 동작해
import './styles/global.scss';

// 런타임 환경 로더
import { loadRuntimeEnv } from '@/composables/useRuntimeEnv';

// 1) 앱은 바로 부트스트랩
const app = createApp(App);

app.use(router);

app.mount('#app');

// 2) 런타임 환경은 비동기로 뒤에서 로드
//    - 실패해도 앱 구동에는 영향 없음
loadRuntimeEnv().catch((err) => {
  console.warn('[RCTS] runtime env load failed:', err);
});
