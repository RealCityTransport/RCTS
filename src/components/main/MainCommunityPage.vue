<!-- src/components/main/MainCommunityPage.vue -->
<template>
  <div class="community-page">
    <!-- 상단 설명 헤더 -->
    <header class="community-header">
      <div class="community-title-block">
        <h2 class="page-title">커뮤니티</h2>
        <span class="community-badge">ASYNC HUB</span>
      </div>
      <p class="page-desc">
        비동기 커뮤니케이션을 위한 공유 공간입니다.<br />
        플레이 로그, 노선 설계안, 운영 노트, 스냅샷 등을 천천히 쌓아갈 수 있습니다.
      </p>
    </header>

    <!-- 본문 2단 레이아웃 -->
    <section class="community-grid">
      <!-- 왼쪽: 안내/운영 정보 -->
      <article class="community-card">
        <h3 class="card-title">운영 노트 · 안내</h3>
        <ul class="card-list">
          <li>· 커뮤니티는 실시간 채팅이 아닌, 비동기 기록 중심으로 운영됩니다.</li>
          <li>· 플레이어별 노선 아이디어, 스크린샷, 운영 리포트를 정리해 둘 수 있습니다.</li>
          <li>· 중요한 공지/패치 노트는 상단 고정 형태로 노출할 예정입니다.</li>
        </ul>
        <p class="card-footer-text">
          이후 Firestore/스토리지와 연동해서, 실제 글/자료 업로드 흐름을 이 영역부터 확장할 수 있습니다.
        </p>
      </article>

      <!-- 오른쪽: 최근 공유 스트림(예정 영역) -->
      <article class="community-card">
        <h3 class="card-title">최근 커뮤니티 스트림 (준비중)</h3>
        <p class="card-placeholder">
          향후 이곳에는 최근에 올라온 커뮤니티 자료들이 시간 순서로 표시됩니다.
        </p>
        <ul class="card-list muted">
          <li>· 예시: “[운영일지] 2034-03-12 야간 배차 최적화 테스트 로그”</li>
          <li>· 예시: “[노선 제안] 동서 순환선 + 직통 셔틀 구성안”</li>
          <li>· 예시: “[버그 리포트] 특정 시간대 승객 집계 불일치”</li>
        </ul>
        <p class="card-footer-text">
          구조만 먼저 잡아두고, 이후 컬렉션 구조 설계 후 실제 데이터 목록으로 교체하면 됩니다.
        </p>
      </article>
    </section>
  </div>
</template>

<script setup>
// 현재는 순수 레이아웃 컴포넌트
// 나중에 Firestore 연동시 여기서 composable/import 추가하면 됨
</script>

<style scoped>
.community-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 상단 헤더 */

.community-header {
  padding: 12px 12px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.community-title-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
}

.page-desc {
  font-size: 0.82rem;
  opacity: 0.9;
  line-height: 1.5;
}

.community-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.9);
  background: rgba(56, 189, 248, 0.15);
  letter-spacing: 0.08em;
}

/* 2단 그리드 */

.community-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.community-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.card-list {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-bottom: 8px;
}

.card-list li {
  line-height: 1.5;
}

.card-list.muted {
  opacity: 0.85;
}

.card-placeholder {
  margin-bottom: 6px;
  opacity: 0.9;
}

.card-footer-text {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* 반응형 */

@media (min-width: 768px) {
  .community-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  }
}
</style>
