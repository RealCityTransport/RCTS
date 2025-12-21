// src/main.js
import { watch } from 'vue';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import '@/styles/global.scss';

import { useAuth } from '@/composables/useAuth';
import { useResearch } from '@/composables/useResearch';

const { user, authReady } = useAuth();
const { loadForUser, clearUserState } = useResearch();

// 로그인/로그아웃에 따라 연구 상태를 계정 단위로 로드/초기화
let lastUid = null;

watch(
  [authReady, user],
  async ([ready, currentUser]) => {
    if (!ready) return;

    // 로그아웃
    if (!currentUser) {
      lastUid = null;
      clearUserState();
      return;
    }

    // 로그인/계정 전환
    const uid = currentUser.uid;
    if (!uid) return;
    if (uid === lastUid) return;

    lastUid = uid;
    await loadForUser(uid);
  },
  { immediate: true }
);

const app = createApp(App);
app.use(router);
app.mount('#app');
