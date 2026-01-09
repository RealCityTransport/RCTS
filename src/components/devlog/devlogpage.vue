<!-- src/components/devlog/devlogpage.vue -->
<template>
  <section class="devlog-root">
    <header class="devlog-hero">
      <div class="hero-inner">
        <div class="kicker">RCTS</div>
        <h1 class="title">Devlog</h1>
        <p class="sub">
          개발 기록/업데이트 노트 영역. (초기엔 고정된 카드형 로그 → 추후 목록/필터 확장)
        </p>

        <nav class="hero-actions">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>작성 준비 중</button>
        </nav>
      </div>
    </header>

    <main class="devlog-main">
      <div class="container">
        <article class="card">
          <div class="card-head">
            <h2 class="card-title">초기 세팅</h2>
            <div class="card-meta">Draft</div>
          </div>
          <p class="card-text">
            Vite + Vue3 베이스를 새로 만들고, 구조를 components 기반으로 통일하기 시작.
            (이 카드들은 샘플. 나중에 실제 로그 데이터로 교체)
          </p>
        </article>

        <article class="card">
          <div class="card-head">
            <h2 class="card-title">레이아웃 통일</h2>
            <div class="card-meta">Planned</div>
          </div>
          <ul class="card-list">
            <li>About / Community / Devlog 페이지 레이아웃 톤 통일</li>
            <li>메인 허브(MainView)에서 카드 단위로 진입</li>
            <li>추후 Wiki도 동일 규칙 적용</li>
          </ul>
        </article>

        <article class="card">
          <div class="card-head">
            <h2 class="card-title">다음 목표</h2>
            <div class="card-meta">Next</div>
          </div>
          <p class="card-text">
            Devlog는 “짧은 카드형 업데이트”를 기본으로 두고, 나중에 태그/검색/페이지네이션을 붙이면
            운영하기 편해질 거야.
          </p>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
.devlog-root {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b1220 0%, #05070d 60%, #000 100%);
  color: rgba(255, 255, 255, 0.92);
}

.devlog-hero {
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

.devlog-main {
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

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.card-meta {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.9);

  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.45);
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

@media (max-width: 767px) {
  .title {
    font-size: 32px;
  }

  .devlog-hero {
    padding-top: 44px;
  }
}
</style>
