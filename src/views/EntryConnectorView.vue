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
            이 페이지는 테스트 · 사전 공개 · 운영 환경을 선택하는 공용 진입 허브입니다.
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
            to="/idle"
            class="entry-link"
          >
            테스트 환경으로 이동
          </RouterLink>

          <p class="card-warning">
            이 환경은 <strong>실험용</strong>이며,
            데이터나 흐름이 수시로 변경될 수 있습니다.
          </p>
        </div>
      </section>

      <!-- 2️⃣ 사전 사이트 (프리뷰 환경) -->
      <section class="entry-card entry-card-pre">
        <div class="card-header">
          <div class="card-title-row">
            <h2 class="card-title">사전 사이트 (프리뷰 환경)</h2>
            <span class="env-badge env-badge-pre">
              PREVIEW · 곧 공개 예정
            </span>
          </div>
          <p class="card-desc">
            운영 환경에 배포되기 전,
            <strong>사전 공개용 빌드</strong>를 제공할 예정입니다.<br />
            현재는 준비 중으로 접속 기능이 비활성화되어 있습니다.
          </p>
        </div>

        <ul class="card-list">
          <li>· 운영 직전 버전 검증</li>
          <li>· 선택 기능/시나리오 사전 체험</li>
          <li>· UI/UX 최종 조정용 환경</li>
        </ul>

        <div class="card-footer">
          <div class="pre-soon-badge">
            <span class="dot"></span>
            <span class="pre-soon-text">
              사전 사이트 준비 중입니다. 곧 공개될 예정입니다.
            </span>
          </div>

          <p class="card-warning">
            URL 및 배포 정책 확정 후
            <strong>접속 버튼이 활성화</strong>됩니다.
          </p>
        </div>
      </section>

      <!-- 3️⃣ 본 사이트 (운영 환경) -->
      <section class="entry-card entry-card-prod">
        <div class="card-header">
          <div class="card-title-row">
            <h2 class="card-title">본 사이트 (운영 환경)</h2>
            <span class="env-badge env-badge-prod">
              PROD · GitHub Pages
            </span>
          </div>
          <p class="card-desc">
            현재 GitHub Pages에서 운영 중인
            <strong>RCTS 본 서비스 환경</strong>입니다.
          </p>
        </div>

        <ul class="card-list">
          <li>· 실제 사용자 노출 운영 버전</li>
          <li>· 안정된 기능과 데이터 흐름</li>
          <li>· <code>/RCTS/</code> 경로 기준 서비스</li>
        </ul>

        <div class="card-footer">
          <a
            :href="prodUrl"
            class="entry-link entry-link-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            본 사이트 새 탭에서 열기
          </a>

          <p class="card-warning">
            향후 운영 코드가 이식되면
            내부 View로 전환될 예정입니다.
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

const prodUrl = 'https://realcitytransport.github.io/RCTS/'
</script>

<style scoped>
/* (스타일은 이전 버전 그대로 유지 — 카드 순서만 변경됨) */

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

.entry-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-block {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
  font-size: 0.78rem;
}

/* 세로 카드 레이아웃 */
.entry-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 카드 공통 */
.entry-card {
  padding: 18px 16px 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.5);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.85);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-card-dev { border-style: dashed; }
.entry-card-prod { border-style: solid; }
.entry-card-pre {
  border-style: dotted;
  border-color: rgba(129, 140, 248, 0.9);
}

.env-badge {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.08em;
}

.env-badge-dev {
  border:1px solid rgba(56,189,248,.9);
  background:rgba(56,189,248,.14);
}

.env-badge-pre {
  border:1px solid rgba(129,140,248,.9);
  background:rgba(129,140,248,.16);
}

.env-badge-prod {
  border:1px solid rgba(249,115,22,.9);
  background:rgba(249,115,22,.16);
}

.entry-link {
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.85);
  text-decoration: none;
  color: #e5e7eb;
}

.entry-link-primary { border-color:#f97316; }

.pre-soon-badge {
  display:flex;
  align-items:center;
  gap:8px;
  padding:7px 12px;
  border-radius:999px;
  border:1px dashed rgba(129,140,248,.9);
}
.dot {
  width:8px;height:8px;border-radius:50%;
  background:rgba(129,140,248,1);
}
</style>
