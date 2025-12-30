<!-- src/components/main/MainAboutPage.vue -->
<template>
  <div class="about-root">
    <!-- 히어로 영역 -->
    <section class="about-hero">
      <div class="hero-text">
        <p class="hero-badge">Urban Transport Simulation</p>
        <h2 class="hero-title">Real City Transport Simulator (RCTS)</h2>
        <p class="hero-subtitle">
          실제 도시 데이터를 기반으로 노선, 차량, 운행, 재정을 모두 다루는
          웹 기반 교통 경영 시뮬레이터입니다.
          이 사이트는 거대한 상업 서비스라기보다,
          개인이 운영하는 게임 사이트로서
          함께 즐기고 실험해 보는 것을 중요한 목표로 삼고 있습니다.
        </p>
      </div>

      <aside class="hero-meta">
        <h3 class="meta-title">프로젝트 한눈에 보기</h3>
        <dl class="meta-list">
          <div class="meta-row">
            <dt>장르</dt>
            <dd>도시 교통 / 경영 시뮬레이션</dd>
          </div>
          <div class="meta-row">
            <dt>플랫폼</dt>
            <dd>웹 (데스크톱 중심, 반응형 대응)</dd>
          </div>
          <div class="meta-row">
            <dt>엔진</dt>
            <dd>DTS (Dynamic Transport System)</dd>
          </div>
          <div class="meta-row">
            <dt>핵심 특징</dt>
            <dd>실제 도시 데이터 · 노선/차량/운행 통합 관리 · 방치형 운영</dd>
          </div>
        </dl>
      </aside>
    </section>

    <!-- 핵심 소개 카드 영역 -->
    <section class="about-grid">
      <article class="about-card">
        <h3 class="card-title">RCTS란 무엇인가요?</h3>
        <p class="card-text">
          RCTS는 “Real City Transport Simulator”의 약자로,
          실제 도시를 기반으로 교통 시스템을 설계하고 운행 결과를 관찰하는
          장기 플레이용 프로젝트입니다.
        </p>
        <p class="card-text">
          이 사이트는 개발자가 개인적으로 운영하는 게임 사이트이자,
          교통 시뮬레이션을 좋아하는 사람들이 함께 들러
          느긋하게 즐기고 의견을 나눌 수 있는 작은 놀이터를 지향합니다.
        </p>
        <p class="card-text">
          단순한 노선 배치가 아니라, 도시 구조와 수요를 고려한 운행 전략,
          재정 관리, 장기적인 네트워크 확장을 함께 다루는 것을 목표로 합니다.
        </p>
      </article>

      <article class="about-card">
        <h3 class="card-title">DTS 엔진과의 관계</h3>
        <p class="card-text">
          DTS는 RCTS의 핵심 로직을 담당하는 내부 엔진 계층으로,
          시간 흐름, 노선 정보, 차량 상태, 운행 스케줄 등
          시뮬레이션에 필요한 데이터를 통합 관리합니다.
        </p>
        <p class="card-text">
          RCTS는 이 DTS 엔진을 기반으로, 웹 UI에서
          직관적인 인터페이스와 시각적인 피드백을 제공하는
          “프런트엔드 셸” 역할을 수행합니다.
        </p>
      </article>

      <article class="about-card">
        <h3 class="card-title">개발 방향 및 목표</h3>
        <ul class="card-list">
          <li>실제 도시 데이터를 활용한 노선·운행 시뮬레이션</li>
          <li>대시보드 / 노선 / 차량 / 운행 / 로그 / 방치형 운영의 통합 UX</li>
          <li>장기 플레이에 적합한 안정적인 시간·로그 시스템</li>
          <li>개발 로그(DEVLOG)와 위키(WIKI)로 투명한 개발 과정 기록</li>
          <li>“같이 즐기는 개인 게임 사이트”로서의 가벼운 접근성과 실험성 유지</li>
        </ul>
      </article>
    </section>

    <!-- 기술 스택 / 라이선스 영역 -->
    <section class="about-footer">
      <div class="about-tech">
        <h3 class="subsection-title">기술 스택</h3>
        <ul class="tech-badges">
          <li class="badge">Vue 3 · Composition API</li>
          <li class="badge">Vite 기반 번들링</li>
          <li class="badge">Firebase Auth</li>
          <li class="badge">DTS 내부 엔진</li>
        </ul>
        <p class="tech-note">
          위 기술 스택은 프로젝트 진행 상황에 따라 확장·변경될 수 있습니다.
        </p>
      </div>

      <div class="about-license">
        <h3 class="subsection-title">라이선스 / 크레딧</h3>
        <p class="license-text">
          RCTS는 개인/소규모 프로젝트로 시작된 실험적인 시뮬레이터이며,
          “함께 즐기기 위한 개인 게임 사이트”라는 정체성을 유지하고자 합니다.
        </p>
        <p class="license-text">
          사용되는 데이터, 이미지, 코드의 라이선스 정책은
          추후 별도 문서로 정리해 이 영역에서 함께 안내할 예정입니다.
          피드백, 제안, 버그 리포트는 DEVLOG / WIKI를 통해 천천히 정리해 나가며,
          장기적으로는 외부 기여를 받을 수 있는 구조를 목표로 합니다.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
// 현재는 고정형 정보만 다루므로 별도 로직 없음.
// 필요 시 추후 props나 composable을 주입해 동적 내용으로 확장 가능.
</script>

<style scoped>
.about-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 히어로 영역 */

.about-hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 4px;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.8);
  background: rgba(15, 23, 42, 0.9);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.95;
}

.hero-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-subtitle {
  font-size: 0.86rem;
  line-height: 1.6;
  opacity: 0.9;
}

.hero-meta {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), rgba(15, 23, 42, 0.98));
  padding: 10px 12px;
}

.meta-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
}

.meta-row {
  display: flex;
  gap: 6px;
}

.meta-row dt {
  min-width: 56px;
  opacity: 0.7;
}

.meta-row dd {
  margin: 0;
  flex: 1;
}

/* 카드 그리드 */

.about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.about-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.9);
  padding: 10px 12px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.card-text {
  font-size: 0.8rem;
  line-height: 1.6;
  opacity: 0.9;
}

.card-text + .card-text {
  margin-top: 4px;
}

.card-list {
  padding-left: 16px;
  font-size: 0.8rem;
  line-height: 1.6;
  opacity: 0.9;
}

.card-list li + li {
  margin-top: 2px;
}

/* 하단 영역 */

.about-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  padding-top: 10px;
}

.subsection-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.badge {
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.72rem;
  white-space: nowrap;
}

.tech-note {
  font-size: 0.76rem;
  opacity: 0.8;
}

.license-text {
  font-size: 0.78rem;
  line-height: 1.6;
  opacity: 0.9;
}

/* 반응형 */

@media (min-width: 768px) {
  .about-hero {
    flex-direction: row;
    align-items: flex-start;
  }

  .hero-text {
    flex: 2;
  }

  .hero-meta {
    flex: 1.3;
  }

  .about-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .about-footer {
    flex-direction: row;
    align-items: flex-start;
  }

  .about-tech,
  .about-license {
    flex: 1;
  }
}
</style>
