<!-- src/components/community/communitypage.vue -->
<template>
  <section class="community-root">
    <header class="community-hero">
      <div class="hero-inner">
        <div class="kicker">RCTS</div>
        <h1 class="title">Community</h1>
        <p class="sub">
          커뮤니티/소통 영역. (추후 포럼, 공지, 링크, 디스코드/오픈채팅 등 연결)
        </p>

        <nav class="hero-actions">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>
            준비 중
          </button>
        </nav>
      </div>
    </header>

    <main class="community-main">
      <div class="container">
        <article class="card">
          <h2 class="card-title">공지</h2>
          <p class="card-text">
            이 영역은 커뮤니티 공지/규칙/가이드의 상단 고정 영역으로 사용할 예정.
          </p>
        </article>

        <article class="card">
          <h2 class="card-title">소통 채널</h2>
          <div class="channel-grid">
            <div class="channel">
              <div class="channel-name">Discord</div>
              <div class="channel-desc">연동 예정</div>
              <button class="channel-btn" type="button" disabled>Open</button>
            </div>

            <div class="channel">
              <div class="channel-name">Forum</div>
              <div class="channel-desc">연동 예정</div>
              <button class="channel-btn" type="button" disabled>Open</button>
            </div>

            <div class="channel">
              <div class="channel-name">Chat</div>
              <div class="channel-desc">연동 예정</div>
              <button class="channel-btn" type="button" disabled>Open</button>
            </div>

            <div class="channel">
              <div class="channel-name">Feedback</div>
              <div class="channel-desc">연동 예정</div>
              <button class="channel-btn" type="button" disabled>Open</button>
            </div>
          </div>
        </article>

        <article class="card">
          <h2 class="card-title">개발/운영 노트</h2>
          <p class="card-text">
            커뮤니케이션 페이지는 “링크 허브” 역할을 먼저 하고, 이후에 내부 게시판/댓글 등
            확장하는 구조로 가면 깔끔해.
          </p>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
.community-root {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b1220 0%, #05070d 60%, #000 100%);
  color: rgba(255, 255, 255, 0.92);
}

.community-hero {
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

.community-main {
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

.channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel {
  border-radius: 14px;
  padding: 14px;

  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);

  display: grid;
  gap: 6px;
}

.channel-name {
  font-weight: 900;
  letter-spacing: 0.02em;
}

.channel-desc {
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.9rem;
}

.channel-btn {
  margin-top: 4px;
  border-radius: 12px;
  padding: 10px 10px;

  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: rgba(255, 255, 255, 0.92);

  font-weight: 900;
  cursor: pointer;
}

.channel-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .title {
    font-size: 32px;
  }

  .community-hero {
    padding-top: 44px;
  }

  .channel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
