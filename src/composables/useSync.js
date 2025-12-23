// src/composables/useSync.js
import { computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useResearch } from '@/composables/useResearch';

// 전역 싱글톤 동기화 상태
let isInitialized = false;

export function useSync() {
  const { user, authReady } = useAuth();
  const research = useResearch();

  const uid = computed(() => user.value?.uid || null);

  const start = () => {
    if (isInitialized) return;

    watch(
      [authReady, uid],
      async ([ready, nextUid], [prevReady, prevUid]) => {
        if (!ready) return;

        // UID가 바뀌면 기존 구독 해제
        if (prevUid && prevUid !== nextUid) {
          research.unsubscribe();
        }

        if (nextUid) {
          // 로그인: 서버 정본 구독 시작
          research.subscribeForUser(nextUid);
        } else {
          // 로그아웃: 구독 해제 + 게스트 정리
          research.unsubscribe();
          research.clearUserState(); // 게스트 모드(로컬 정본 없음)
        }
      },
      { immediate: true }
    );

    isInitialized = true;
  };

  return { start };
}
