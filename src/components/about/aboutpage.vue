<!-- src/components/about/aboutpage.vue -->
<template>
  <section class="about-root">
    <header class="about-hero">
      <div class="about-hero-inner">
        <div class="about-kicker">RCTS</div>
        <h1 class="about-title">About</h1>
        <p class="about-sub">
          Real City Transport Simulator — 프로젝트 소개 및 방향을 정리하는 공간.
        </p>
      </div>
    </header>

    <main class="about-main">
      <div class="about-container">
        <article class="about-card">
          <h2 class="card-title">프로젝트 개요</h2>
          <p class="card-text">
            이 페이지는 추후 본문을 채워넣기 위한 기본 레이아웃만 잡아둔 상태야.
            섹션/카드 단위로 통일된 구조로 확장해갈 예정.
          </p>
        </article>

        <article class="about-card">
          <h2 class="card-title">핵심 방향</h2>
          <ul class="card-list">
            <li>구조 통일: 페이지 본문은 components 아래로만</li>
            <li>점진 개선: 레이아웃/스타일을 뒤집지 않고 단계적으로</li>
            <li>유지보수: 확장 가능한 섹션/카드 기반 구성</li>
          </ul>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
.about-root {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b1220 0%, #05070d 60%, #000 100%);
  color: rgba(255, 255, 255, 0.92);
}

.about-hero {
  padding: 56px 18px 28px;
}

.about-hero-inner {
  width: min(980px, 100% - 24px);
  margin: 0 auto;
}

.about-kicker {
  font-weight: 900;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  opacity: 0.9;
}

.about-title {
  margin: 10px 0 6px;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.about-sub {
  margin: 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.6;
}

.about-main {
  padding: 18px 18px 56px;
}

.about-container {
  width: min(980px, 100% - 24px);
  margin: 0 auto;

  display: grid;
  gap: 14px;
}

.about-card {
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

@media (max-width: 767px) {
  .about-title {
    font-size: 32px;
  }
  .about-hero {
    padding-top: 44px;
  }
}
</style>
