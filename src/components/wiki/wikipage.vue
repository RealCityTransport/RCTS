<!-- src/components/wiki/wikipage.vue -->
<template>
  <section class="wiki-root">
    <header class="wiki-hero">
      <div class="hero-inner">
        <div class="kicker">RCTS</div>
        <h1 class="title">Wiki</h1>
        <p class="sub">
          게임 가이드/정보 정리 공간. (초기엔 섹션 카드 → 추후 문서/목차/검색 확장)
        </p>

        <nav class="hero-actions">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>검색 준비 중</button>
        </nav>
      </div>
    </header>

    <main class="wiki-main">
      <div class="container">
        <article class="card">
          <h2 class="card-title">빠른 시작</h2>
          <p class="card-text">
            RCTS의 기본 목표와 첫 플레이 흐름을 정리하는 영역. (추후 실제 문서로 교체)
          </p>
          <div class="pill-row">
            <span class="pill">Getting Started</span>
            <span class="pill">Basics</span>
          </div>
        </article>

        <article class="card">
          <h2 class="card-title">시스템</h2>
          <ul class="card-list">
            <li>노선</li>
            <li>차량</li>
            <li>운영</li>
            <li>연구/개발</li>
            <li>재정</li>
          </ul>
          <p class="card-hint">
            지금은 섹션만 잡아두고, 나중에 각 항목을 문서로 쪼개서 연결하면 깔끔해.
          </p>
        </article>

        <article class="card">
          <h2 class="card-title">용어/데이터</h2>
          <p class="card-text">
            내부 수치/단위(틱, 표준시간 등)와 게임 내 용어를 정리하는 구역.
          </p>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
.wiki-root {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b1220 0%, #05070d 60%, #000 100%);
  color: rgba(255, 255, 255, 0.92);
}

.wiki-hero {
  padding: 56px 18px 18px;
}

.hero-inner {
  width: min(980px, 100% - 24px);
  margin: 0 auto;
}

.kicker {
  font-weight: 900;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  opacity: 0.9;
}

.title {
  margin: 10px 0 6px;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.sub {
  margin: 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.6;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-ghost {
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: rgba(255, 255, 255, 0.92);
}

.btn-primary {
  background: linear-gradient(135deg, #38bdf8 0%, #6366f1 45%, #a855f7 100%);
  border: none;
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wiki-main {
  padding: 12px 18px 56px;
}

.container {
  width: min(980px, 100% - 24px);
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.card {
  border-radius: 18px;
  padding: 18px 18px;

  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
}

.card-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.card-text {
  margin: 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.7;
}

.card-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.9;
}

.card-hint {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.92rem;
  line-height: 1.6;
}

.pill-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;

  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.32);
  color: rgba(226, 232, 240, 0.92);
}

@media (max-width: 767px) {
  .title {
    font-size: 32px;
  }

  .wiki-hero {
    padding-top: 44px;
  }
}
</style>
