<!-- src/views/EntryConnectorView.vue -->
<template>
  <div class="entry-connector">
    <!-- 상단 헤더 -->
    <header class="entry-header">
      <div class="entry-header-main">
        <h1 class="entry-title">RCTS</h1>
        <p class="entry-subtitle">
          현재 연결 가능한 환경을 선택해 주세요.
        </p>
      </div>

      <div class="entry-header-meta">
        <div class="meta-block">
          <span class="meta-label">현재 표준시간</span>
          <span class="meta-value">
            {{ formattedGameTime }}
          </span>
        </div>

        <div class="meta-block meta-note">
          <span class="meta-label">안내</span>
          <span class="meta-value">
            이 페이지는 테스트 · 운영 환경을 선택하는 공용 진입 허브입니다.
          </span>
        </div>
      </div>
    </header>

    <!-- 본문: 세로 카드 레이아웃 -->
    <main class="entry-main">
      <!-- 1️⃣ 테스트(개발) 환경 -->
      <section class="entry-card entry-card-dev">
        <div class="card-header">
          <div class="card-title-row">
            <h2 class="card-title">테스트 환경</h2>
            <span class="env-badge env-badge-dev">
              TEST · 내부 방치형 운영
            </span>
          </div>
          <p class="card-desc">
            소스 저장소 기준으로 동작하는
            <strong>방치형 메인 화면(/idle)</strong>입니다.<br />
            새로운 기능과 시스템을 가장 먼저 실험하는 환경입니다.
          </p>
        </div>

        <ul class="card-list">
          <li>· 최신 개발 빌드 기반</li>
          <li>· 운송/연구/방치형 시스템 테스트</li>
          <li>· 내부 검증용 데이터 흐름</li>
        </ul>

        <div class="card-footer">
          <RouterLink
            to="/idletest"
            class="entry-link"
          >
            테스트 환경으로 이동
          </RouterLink>

          <p class="card-warning">
            이 환경은 <strong>실험용</strong>이며,
            테스트 서버에 저장도 되지만 레이아웃과 기능이 수시로 바뀔 수 있습니다.
          </p>
        </div>
      </section>

      <!-- 3️⃣ 본 사이트 (운영 환경) -->
      <section class="entry-card entry-card-prod">
        <div class="card-header">
          <div class="card-title-row">
            <h2 class="card-title">본 사이트 (운영 환경)</h2>
            <span class="env-badge env-badge-prod">
              PROD · 운영 환경
            </span>
          </div>
          <p class="card-desc">
            현재 운영 중인 RCTS 본 서비스 환경입니다.
          </p>
        </div>

        <ul class="card-list">
          <li>· 실제 서비스 운영 버전</li>
          <li>· 안정된 기능 제공</li>
          <li>· 공식 운영 환경</li>
        </ul>

        <div class="card-footer">
          <div class="pre-soon-badge">
            <span class="dot"></span>
            <span class="pre-soon-text">
              본 사이트는 이제 곧 연결됩니다.
            </span>
          </div>

          <p class="card-warning">
            운영 적용이 완료되면
            <strong>접속 버튼이 활성화</strong>됩니다.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameTime } from '@/composables/useGameTime'
import { formatKstTimeYYYYMMDDHHMM } from '@/utils/timeFormat'

const { gameTime } = useGameTime({ initialSpeed: 1 })

const formattedGameTime = computed(() =>
  formatKstTimeYYYYMMDDHHMM(gameTime.value),
)
</script>

<style scoped>
.entry-connector {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;

  background: radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent),
    #020617;
  color: #f9fafb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SUIT',
    sans-serif;
}

/* 헤더 영역 */
.entry-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-header-main {
  text-align: left;
}

.entry-title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-subtitle {
  margin-top: 4px;
  font-size: 0.95rem;
  opacity: 0.9;
}

.entry-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-block {
  min-width: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
}

.meta-label {
  font-weight: 600;
  opacity: 0.9;
}

.meta-value {
  opacity: 0.9;
  white-space: nowrap;
}

.meta-note {
  max-width: 100%;
}

.meta-note .meta-value {
  white-space: normal;
}

/* 본문: 세로 카드 레이아웃 */
.entry-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 카드 공통 */
.entry-card {
  padding: 18px 16px 16px;
  border-radius: 18px;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.5);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.85);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-card-dev {
  border-style: dashed;
}

.entry-card-prod {
  border-style: solid;
}

.entry-card-pre {
  border-style: dotted;
  border-color: rgba(129, 140, 248, 0.9);
}

/* 카드 헤더 */
.card-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.env-badge {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.env-badge-dev {
  border-color: rgba(56, 189, 248, 0.9);
  background: rgba(56, 189, 248, 0.12);
}

.env-badge-pre {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(129, 140, 248, 0.14);
}

.env-badge-prod {
  border-color: rgba(249, 115, 22, 0.9);
  background: rgba(249, 115, 22, 0.16);
}

.card-desc {
  font-size: 0.86rem;
  opacity: 0.9;
}

/* 카드 리스트 */
.card-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 카드 푸터 */
.card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

/* 버튼/링크 스타일 (RouterLink용) */
.entry-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.85);
  font-size: 0.86rem;
  text-decoration: none;
  color: #e5e7eb;
  backdrop-filter: blur(8px);
  transition: all 0.18s ease-out;
  cursor: pointer;
}

.entry-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.7);
  border-color: #e5e7eb;
}

.entry-link-primary {
  border-color: #f97316;
}

.entry-link-primary:hover {
  box-shadow: 0 12px 32px rgba(248, 113, 113, 0.55);
}

/* 사전/본 사이트용 안내 뱃지 */
.pre-soon-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px dashed rgba(129, 140, 248, 0.9);
  font-size: 0.8rem;
}

.pre-soon-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 1);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.8);
}

.pre-soon-text {
  opacity: 0.9;
}

/* 경고/안내 문구 */
.card-warning {
  font-size: 0.76rem;
  opacity: 0.85;
}

/* 반응형 */
@media (min-width: 768px) {
  .entry-connector {
    padding: 24px 32px 28px;
    max-width: 900px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .entry-connector {
    padding: 28px 40px 32px;
    max-width: 960px;
  }
}
</style>
