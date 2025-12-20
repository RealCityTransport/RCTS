// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// 🔥 전역 스타일을 한 번만 임포트합니다. 🔥
// 이 라인은 이제 vite.config.js의 additionalData와 역할이 중복될 수 있습니다.
// 하지만 additionalData는 변수 주입용이고, 이 import는 App.vue의 최종 스타일 적용 순서에 영향을 줍니다.
// 일단은 유지하고, 문제 발생 시 제거를 고려합니다. (기존 방식대로 남겨두는 게 안정적)
import '@/styles/global.scss'; 

// useAuth 모듈 임포트 및 초기화
import { useAuth } from '@/composables/useAuth';
useAuth(); 

// useResearch 모듈 임포트 및 초기화 (Composables 내부에서 초기화 로직을 보호함)
import { useResearch } from '@/composables/useResearch';
// useResearch(); // ⚠️ 이제 useResearch 모듈 내부에서 isResearchStateInitialized 플래그로 보호되므로
                 // main.js에서 직접 호출할 필요가 없습니다. (컴포넌트에서 useResearch() 호출 시 초기화)

const app = createApp(App);

app.use(router);
app.mount('#app');