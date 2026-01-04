<!-- src/views/PlayView.vue -->
<template>
  <!-- 로그인된 경우에만 실제 콘텐츠 렌더 -->
  <div v-if="isLoggedIn" class="play-root">
    <div class="play-layout">
      <!-- 왼쪽: 관제 화면 영역 -->
      <section class="play-panel play-panel--left">
        <PlayControlDisplay />
      </section>

      <!-- 오른쪽: 관제 테블릿 영역 -->
      <section class="play-panel play-panel--right">
        <TabletCompanySetup />
      </section>
    </div>
  </div>

  <!-- 로그인 전 / 인증 초기화 중 -->
  <div v-else class="play-guard-message">
    플레이 화면에 접속하기 위해 로그인 상태를 확인하고 있습니다...
  </div>
</template>

<script setup>
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import PlayControlDisplay from '@/components/play/PlayControlDisplay.vue'
import TabletCompanySetup from '@/components/play/tablet/TabletCompanySetup.vue'

const { isLoggedIn } = useFirebaseAuth()
</script>

<style scoped>
/* 페이지 전체 스크롤 차단 + 화면 고정 */
.play-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 내부 2컬럼 레이아웃 */
.play-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.play-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* 로그인 보호 / 로딩 메시지 */
.play-guard-message {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  opacity: 0.85;
  font-size: 0.9rem;
}

/* ---------------- 반응형 ---------------- */
@media (max-width: 1024px) {
  .play-root {
    padding: 8px;
  }

  .play-layout {
    grid-template-columns: 1fr;
  }

  .play-panel--left {
    display: none;
  }
}

@media (max-width: 640px) {
  .play-root {
    padding: 0;
  }
}
</style>
