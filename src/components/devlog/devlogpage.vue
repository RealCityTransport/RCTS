<!-- src/components/devlog/devlogpage.vue -->
<template>
  <section class="devlog-shell">
    <!-- Global Topbar -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark">R</div>
          <div class="brand-text">
            <div class="brand-kicker">RCTS</div>
            <div class="brand-title">Devlog</div>
          </div>
        </div>

        <div class="search">
          <div class="search-wrap">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input
              class="search-input"
              type="text"
              placeholder="검색 (준비 중)"
              disabled
            />
          </div>
          <button class="search-btn" type="button" disabled>검색</button>
        </div>

        <nav class="top-actions" aria-label="개발로그 상단 액션">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>새 글</button>
        </nav>
      </div>
    </header>

    <!-- Layout -->
    <div class="layout">
      <div class="layout-inner">
        <!-- Sidebar -->
        <aside class="sidebar" aria-label="개발로그 내비게이션">
          <div class="side-card">
            <div class="side-title">Devlog</div>
            <p class="side-sub">
              개발 기록/업데이트 노트 영역.
              <span class="side-sub-weak">(추후 목록/필터/태그/검색 확장)</span>
            </p>
          </div>

          <div class="side-section">
            <div class="side-section-title">필터</div>
            <div class="filter-row">
              <button class="filter-pill is-active" type="button" disabled>전체</button>
              <button class="filter-pill" type="button" disabled>업데이트</button>
              <button class="filter-pill" type="button" disabled>UI</button>
              <button class="filter-pill" type="button" disabled>시스템</button>
              <button class="filter-pill" type="button" disabled>배포</button>
            </div>
          </div>

          <div class="side-section">
            <div class="side-section-title">아카이브</div>
            <div class="side-links">
              <a class="side-link is-active" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                최신
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                2026
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                2025
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                2024
              </a>
            </div>
          </div>

          <div class="side-footer">
            <div class="side-footer-row">
              <span class="side-footer-label">상태</span>
              <span class="side-footer-value">초기 구성</span>
            </div>
            <div class="side-footer-row">
              <span class="side-footer-label">글</span>
              <span class="side-footer-value">0</span>
            </div>
            <div class="side-footer-row">
              <span class="side-footer-label">태그</span>
              <span class="side-footer-value">0</span>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <main class="main">
          <!-- Page header -->
          <div class="pagehead">
            <div class="crumbs">
              <span class="crumb">RCTS</span>
              <span class="sep">/</span>
              <span class="crumb is-current">Devlog</span>
            </div>

            <div class="page-title-row">
              <h1 class="page-title">개발로그</h1>
              <div class="page-meta">
                <span class="meta-item">정렬: 최신순</span>
                <span class="meta-sep">·</span>
                <span class="meta-item">표시: 카드</span>
              </div>
            </div>

            <div class="notice">
              <span class="notice-dot" aria-hidden="true"></span>
              <span class="notice-text">
                지금은 “운영형 레이아웃” 먼저 고정. 이후 실제 로그 데이터 + 태그/검색/페이지네이션이 붙는 구조야.
              </span>
            </div>
          </div>

          <!-- Summary cards -->
          <section class="stats" aria-label="개발로그 요약">
            <article class="stat-card">
              <div class="stat-label">이번 주</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">업데이트</div>
            </article>

            <article class="stat-card">
              <div class="stat-label">릴리즈</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">태그/배포</div>
            </article>

            <article class="stat-card">
              <div class="stat-label">이슈</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">진행/해결</div>
            </article>

            <article class="stat-card">
              <div class="stat-label">작업</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">UI/시스템</div>
            </article>
          </section>

          <!-- Feed -->
          <section class="feed" aria-label="개발로그 피드">
            <article class="post">
              <div class="post-head">
                <div class="post-title-row">
                  <h2 class="post-title">초기 세팅</h2>
                  <span class="status-badge">Draft</span>
                </div>
                <div class="post-meta">
                  <span class="meta-chip">2026-01-XX</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">Setup</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">Vite / Vue3</span>
                </div>
              </div>

              <p class="post-text">
                Vite + Vue3 베이스를 새로 만들고, 구조를 components 기반으로 통일하기 시작.
                <span class="weak">(이 카드들은 샘플. 나중에 실제 로그 데이터로 교체)</span>
              </p>

              <div class="post-actions">
                <button class="mini-btn" type="button" disabled>자세히</button>
                <span class="tag">Update</span>
                <span class="tag">Structure</span>
              </div>
            </article>

            <article class="post">
              <div class="post-head">
                <div class="post-title-row">
                  <h2 class="post-title">레이아웃 통일</h2>
                  <span class="status-badge is-soft">Planned</span>
                </div>
                <div class="post-meta">
                  <span class="meta-chip">2026-01-XX</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">UI</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">Global Pages</span>
                </div>
              </div>

              <ul class="post-list">
                <li>About / Community / Devlog 페이지 레이아웃 톤 통일</li>
                <li>메인 허브(MainView)에서 카드 단위로 진입</li>
                <li>추후 Wiki도 동일 규칙 적용</li>
              </ul>

              <div class="post-actions">
                <button class="mini-btn" type="button" disabled>작업 보기</button>
                <span class="tag">UI</span>
                <span class="tag">Layout</span>
              </div>
            </article>

            <article class="post">
              <div class="post-head">
                <div class="post-title-row">
                  <h2 class="post-title">다음 목표</h2>
                  <span class="status-badge is-strong">Next</span>
                </div>
                <div class="post-meta">
                  <span class="meta-chip">2026-01-XX</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">Plan</span>
                  <span class="meta-dot">·</span>
                  <span class="meta-chip">Operations</span>
                </div>
              </div>

              <p class="post-text">
                Devlog는 “짧은 카드형 업데이트”를 기본으로 두고, 나중에 태그/검색/페이지네이션을 붙이면
                운영하기 편해질 거야.
              </p>

              <div class="post-actions">
                <button class="mini-btn" type="button" disabled>로드맵</button>
                <span class="tag">Plan</span>
                <span class="tag">Backlog</span>
              </div>
            </article>

            <!-- Empty state 느낌도 “운영형”으로 -->
            <div class="empty">
              <div class="empty-icon" aria-hidden="true">🗂️</div>
              <div class="empty-title">실제 로그 데이터 연결 준비 중</div>
              <div class="empty-sub">
                다음 단계: 로그 스키마/태그/목록 컴포넌트 분리 → 필터/검색 연결
              </div>
            </div>
          </section>

          <!-- Footer inside main -->
          <footer class="footer">
            <div class="footer-inner">
              <div class="footer-left">
                <div class="footer-brand">RCTS Devlog</div>
                <div class="footer-sub">업데이트 기록 · 배포 노트 · 개발 히스토리</div>
              </div>
              <div class="footer-right">
                <span class="footer-chip">Feed</span>
                <span class="footer-chip">Tags</span>
                <span class="footer-chip">Releases</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <div class="bottom-fade" aria-hidden="true"></div>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
/* =========
   Shell / Background
   ========= */
.devlog-shell {
  min-height: 100vh;
  color: rgba(255, 255, 255, 0.92);
  background:
    radial-gradient(1200px 520px at 20% -10%, rgba(99, 102, 241, 0.18), transparent 70%),
    radial-gradient(900px 420px at 85% 0%, rgba(56, 189, 248, 0.14), transparent 65%),
    radial-gradient(circle at top, #0b1220 0%, #05070d 62%, #000 100%);
}

/* =========
   Topbar
   ========= */
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(14px);
  background: rgba(2, 6, 23, 0.62);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.topbar-inner {
  width: min(1180px, 100% - 28px);
  margin: 0 auto;
  padding: 14px 0;
  display: grid;
  grid-template-columns: 1fr minmax(260px, 520px) auto;
  align-items: center;
  gap: 14px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  background: rgba(129, 140, 248, 0.16);
  border: 1px solid rgba(129, 140, 248, 0.45);
  box-shadow: 0 0 18px rgba(129, 140, 248, 0.12);
}

.brand-kicker {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  opacity: 0.92;
}

.brand-title {
  margin-top: 2px;
  font-size: 0.92rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

.search {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.search-wrap {
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.32);
}

.search-icon {
  font-weight: 900;
  opacity: 0.86;
}

.search-input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(248, 250, 252, 0.92);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.search-input::placeholder {
  color: rgba(226, 232, 240, 0.62);
}

.search-btn {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  letter-spacing: 0.04em;
  cursor: not-allowed;
  opacity: 0.7;
}

.top-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* =========
   Buttons
   ========= */
.btn {
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 900;
  letter-spacing: 0.02em;
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid transparent;
  transition:
    transform 0.08s ease-out,
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    opacity 0.12s ease-out;
}

.btn-ghost {
  background: rgba(15, 23, 42, 0.38);
  border-color: rgba(148, 163, 184, 0.28);
  color: rgba(255, 255, 255, 0.92);
}

.btn-ghost:hover {
  border-color: rgba(191, 219, 254, 0.6);
  background: rgba(15, 23, 42, 0.55);
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.95) 0%, rgba(99, 102, 241, 0.95) 45%, rgba(168, 85, 247, 0.95) 100%);
  border: 1px solid rgba(129, 140, 248, 0.18);
  color: #fff;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

/* =========
   Layout
   ========= */
.layout {
  padding: 18px 0 44px;
}

.layout-inner {
  width: min(1180px, 100% - 28px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

/* =========
   Sidebar
   ========= */
.sidebar {
  position: sticky;
  top: 72px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  border-radius: 18px;
  padding: 14px 14px;
  background: rgba(2, 6, 23, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.side-title {
  font-size: 0.96rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.95);
}

.side-sub {
  margin: 8px 0 0;
  font-size: 0.78rem;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.82);
}

.side-sub-weak {
  color: rgba(226, 232, 240, 0.64);
}

.side-section {
  border-radius: 18px;
  padding: 12px 12px;
  background: rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.side-section-title {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
  margin-bottom: 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-pill {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.22);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  letter-spacing: 0.02em;
  cursor: not-allowed;
  opacity: 0.75;
}

.filter-pill.is-active {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(129, 140, 248, 0.12);
  color: rgba(248, 250, 252, 0.96);
  opacity: 1;
}

.side-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.side-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
  font-weight: 900;
  letter-spacing: 0.02em;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.side-link:hover {
  border-color: rgba(191, 219, 254, 0.6);
  background: rgba(15, 23, 42, 0.5);
  transform: translateY(-1px);
}

.side-link.is-active {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(129, 140, 248, 0.12);
  color: rgba(248, 250, 252, 0.96);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.25);
}

.side-footer {
  border-radius: 18px;
  padding: 12px 12px;
  background: rgba(2, 6, 23, 0.36);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.side-footer-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.side-footer-row + .side-footer-row {
  margin-top: 8px;
}

.side-footer-label {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.86);
}

.side-footer-value {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.9);
}

/* =========
   Main
   ========= */
.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pagehead {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(2, 6, 23, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.crumbs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.72rem;
}

.sep {
  opacity: 0.6;
}

.crumb.is-current {
  color: rgba(226, 232, 240, 0.92);
}

.page-title-row {
  margin-top: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  letter-spacing: 0.02em;
}

.page-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 800;
}

.meta-sep {
  opacity: 0.6;
}

.notice {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(129, 140, 248, 0.22);
  background: rgba(129, 140, 248, 0.08);
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.25);
}

.notice-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.55;
}

/* =========
   Stats
   ========= */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  border-radius: 18px;
  padding: 14px 14px;
  background: rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.stat-label {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
  font-weight: 900;
}

.stat-value {
  margin-top: 8px;
  font-size: 1.05rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.stat-sub {
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 800;
}

/* =========
   Feed posts
   ========= */
.feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(2, 6, 23, 0.36);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.post-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.post-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.status-badge {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.3);
  background: rgba(129, 140, 248, 0.12);
  color: rgba(248, 250, 252, 0.92);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-badge.is-soft {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.28);
  color: rgba(226, 232, 240, 0.86);
}

.status-badge.is-strong {
  border-color: rgba(56, 189, 248, 0.28);
  background: rgba(56, 189, 248, 0.1);
  color: rgba(248, 250, 252, 0.94);
}

.post-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.meta-chip {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.78);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.22);
}

.meta-dot {
  opacity: 0.5;
}

.post-text {
  margin: 12px 0 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.75;
  font-size: 0.86rem;
}

.weak {
  color: rgba(226, 232, 240, 0.66);
}

.post-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.95;
  font-size: 0.86rem;
}

.post-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-btn {
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.22);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  letter-spacing: 0.02em;
  cursor: not-allowed;
  opacity: 0.75;
}

.tag {
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.22);
  background: rgba(129, 140, 248, 0.1);
  color: rgba(248, 250, 252, 0.92);
  font-weight: 900;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
}

/* =========
   Empty
   ========= */
.empty {
  border-radius: 18px;
  padding: 18px 16px;
  background: rgba(15, 23, 42, 0.24);
  border: 1px dashed rgba(148, 163, 184, 0.22);
  display: grid;
  gap: 6px;
  text-align: center;
}

.empty-icon {
  font-size: 1.35rem;
}

.empty-title {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
}

.empty-sub {
  font-size: 0.84rem;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 800;
  line-height: 1.6;
}

/* =========
   Footer
   ========= */
.footer {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(15, 23, 42, 0.26);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-brand {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

.footer-sub {
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.68);
  font-weight: 800;
}

.footer-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-chip {
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.2);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  font-size: 0.74rem;
  letter-spacing: 0.06em;
}

/* =========
   Bottom fade
   ========= */
.bottom-fade {
  height: 44px;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.55));
}

/* =========
   Responsive
   ========= */
@media (max-width: 1040px) {
  .topbar-inner {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "brand actions"
      "search search";
    gap: 10px;
  }

  .brand {
    grid-area: brand;
  }
  .top-actions {
    grid-area: actions;
    justify-content: flex-end;
  }
  .search {
    grid-area: search;
  }

  .layout-inner {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    top: auto;
    order: 2;
  }

  .main {
    order: 1;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .top-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search {
    flex-direction: column;
    align-items: stretch;
  }

  .search-btn {
    width: 100%;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
