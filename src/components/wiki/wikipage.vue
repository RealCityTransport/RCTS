<!-- src/components/wiki/wikipage.vue -->
<template>
  <section class="wiki-shell">
    <!-- Global Topbar -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark">R</div>
          <div class="brand-text">
            <div class="brand-kicker">RCTS</div>
            <div class="brand-title">Knowledge Base</div>
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

        <nav class="top-actions" aria-label="위키 상단 액션">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>새 문서</button>
        </nav>
      </div>
    </header>

    <!-- Layout -->
    <div class="layout">
      <div class="layout-inner">
        <!-- Sidebar -->
        <aside class="sidebar" aria-label="위키 내비게이션">
          <div class="side-card">
            <div class="side-title">Wiki</div>
            <p class="side-sub">
              게임 가이드/정보 정리 공간.
              <span class="side-sub-weak">(추후 문서/목차/검색 확장)</span>
            </p>
          </div>

          <div class="side-section">
            <div class="side-section-title">바로가기</div>
            <div class="side-links">
              <a class="side-link is-active" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                홈
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                빠른 시작
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                시스템
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                용어/데이터
              </a>
            </div>
          </div>

          <div class="side-section">
            <div class="side-section-title">카테고리</div>
            <div class="pill-grid">
              <span class="pill">Getting Started</span>
              <span class="pill">Basics</span>
              <span class="pill">Systems</span>
              <span class="pill">Data</span>
              <span class="pill">Balance</span>
              <span class="pill">Modding</span>
            </div>
          </div>

          <div class="side-footer">
            <div class="side-footer-row">
              <span class="side-footer-label">상태</span>
              <span class="side-footer-value">초기 구성</span>
            </div>
            <div class="side-footer-row">
              <span class="side-footer-label">버전</span>
              <span class="side-footer-value">Alpha</span>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <main class="main">
          <!-- Breadcrumb / Page header -->
          <div class="pagehead">
            <div class="crumbs">
              <span class="crumb">RCTS</span>
              <span class="sep">/</span>
              <span class="crumb is-current">Wiki</span>
            </div>

            <div class="page-title-row">
              <h1 class="page-title">Wiki</h1>
              <div class="page-meta">
                <span class="meta-item">마지막 업데이트: 더미</span>
                <span class="meta-sep">·</span>
                <span class="meta-item">문서: 0</span>
              </div>
            </div>

            <div class="notice">
              <span class="notice-dot" aria-hidden="true"></span>
              <span class="notice-text">
                지금은 “실서비스 레이아웃”을 먼저 고정하는 단계야. 이후 문서/목차/검색을 붙이면 완성도 확 올라가.
              </span>
            </div>
          </div>

          <!-- Highlight cards -->
          <section class="highlights">
            <article class="hl-card">
              <div class="hl-top">
                <div class="hl-icon" aria-hidden="true">⚡</div>
                <div class="hl-title">빠른 시작</div>
              </div>
              <p class="hl-text">
                RCTS의 기본 목표와 첫 플레이 흐름을 정리하는 영역.
                <span class="hl-weak">(추후 실제 문서로 교체)</span>
              </p>
              <div class="hl-actions">
                <button class="mini-btn" type="button" disabled>문서 보기</button>
                <span class="tag">Getting Started</span>
                <span class="tag">Basics</span>
              </div>
            </article>

            <article class="hl-card">
              <div class="hl-top">
                <div class="hl-icon" aria-hidden="true">🧩</div>
                <div class="hl-title">시스템</div>
              </div>
              <ul class="hl-list">
                <li>노선</li>
                <li>차량</li>
                <li>운영</li>
                <li>연구/개발</li>
                <li>재정</li>
              </ul>
              <p class="hl-hint">
                지금은 섹션만 잡아두고, 나중에 각 항목을 문서로 쪼개서 연결하면 깔끔해.
              </p>
              <div class="hl-actions">
                <button class="mini-btn" type="button" disabled>카테고리</button>
                <span class="tag">Systems</span>
              </div>
            </article>

            <article class="hl-card">
              <div class="hl-top">
                <div class="hl-icon" aria-hidden="true">📐</div>
                <div class="hl-title">용어/데이터</div>
              </div>
              <p class="hl-text">
                내부 수치/단위(틱, 표준시간 등)와 게임 내 용어를 정리하는 구역.
              </p>
              <div class="hl-actions">
                <button class="mini-btn" type="button" disabled>용어집</button>
                <span class="tag">Data</span>
                <span class="tag">Balance</span>
              </div>
            </article>
          </section>

          <!-- Sections list (site-like) -->
          <section class="section-grid" aria-label="위키 섹션 목록">
            <article class="sec-card">
              <div class="sec-head">
                <div class="sec-title">추천 문서</div>
                <span class="sec-badge">Soon</span>
              </div>
              <div class="sec-row">
                <div class="sec-item">
                  <div class="sec-item-title">첫 노선 만들기</div>
                  <div class="sec-item-sub">기본 흐름 정리</div>
                </div>
                <button class="sec-go" type="button" disabled>열기</button>
              </div>
              <div class="sec-row">
                <div class="sec-item">
                  <div class="sec-item-title">운영 센터 읽는 법</div>
                  <div class="sec-item-sub">관제 UI 설명</div>
                </div>
                <button class="sec-go" type="button" disabled>열기</button>
              </div>
              <div class="sec-row">
                <div class="sec-item">
                  <div class="sec-item-title">표준시간/틱</div>
                  <div class="sec-item-sub">시간 시스템</div>
                </div>
                <button class="sec-go" type="button" disabled>열기</button>
              </div>
            </article>

            <article class="sec-card">
              <div class="sec-head">
                <div class="sec-title">최근 업데이트</div>
                <span class="sec-badge is-soft">Dummy</span>
              </div>
              <div class="timeline">
                <div class="tl-item">
                  <div class="tl-dot" aria-hidden="true"></div>
                  <div class="tl-body">
                    <div class="tl-title">문서 구조 설계</div>
                    <div class="tl-sub">목차/검색/문서 페이지 예정</div>
                  </div>
                </div>
                <div class="tl-item">
                  <div class="tl-dot" aria-hidden="true"></div>
                  <div class="tl-body">
                    <div class="tl-title">UI 레이아웃 고정</div>
                    <div class="tl-sub">실서비스 느낌 우선</div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <!-- Footer inside main -->
          <footer class="footer">
            <div class="footer-inner">
              <div class="footer-left">
                <div class="footer-brand">RCTS Wiki</div>
                <div class="footer-sub">게임 정보/가이드 · 글로벌 문서 허브</div>
              </div>
              <div class="footer-right">
                <span class="footer-chip">Docs</span>
                <span class="footer-chip">Search</span>
                <span class="footer-chip">Changelog</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <!-- Global bottom fade -->
    <div class="bottom-fade" aria-hidden="true"></div>
  </section>
</template>

<script setup>
</script>

<style scoped lang="scss">
/* =========
   Shell / Background
   ========= */
.wiki-shell {
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

.pill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 10px;
  border-radius: 999px;

  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  background: rgba(2, 6, 23, 0.34);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: rgba(226, 232, 240, 0.9);
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
   Highlights
   ========= */
.highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hl-card {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(15, 23, 42, 0.34);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.hl-top {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.hl-icon {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(129, 140, 248, 0.14);
  border: 1px solid rgba(129, 140, 248, 0.22);
}

.hl-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.95);
}

.hl-text {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.7;
  font-size: 0.84rem;
}

.hl-weak {
  color: rgba(226, 232, 240, 0.68);
}

.hl-list {
  margin: 10px 0 0;
  padding-left: 18px;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.9;
  font-size: 0.84rem;
}

.hl-hint {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.68);
  font-size: 0.8rem;
  line-height: 1.6;
}

.hl-actions {
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
   Section grid
   ========= */
.section-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 12px;
}

.sec-card {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(2, 6, 23, 0.36);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.sec-title {
  font-size: 0.9rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

.sec-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(129, 140, 248, 0.28);
  background: rgba(129, 140, 248, 0.1);
  color: rgba(248, 250, 252, 0.92);
}

.sec-badge.is-soft {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.28);
  color: rgba(226, 232, 240, 0.86);
}

.sec-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.24);
}

.sec-row + .sec-row {
  margin-top: 10px;
}

.sec-item-title {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
  font-size: 0.86rem;
}

.sec-item-sub {
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.68);
  font-size: 0.78rem;
  font-weight: 800;
}

.sec-go {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.75;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tl-item {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 6px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.22);
}

.tl-title {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
  font-size: 0.84rem;
}

.tl-sub {
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.68);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.55;
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

  .highlights {
    grid-template-columns: 1fr;
  }

  .section-grid {
    grid-template-columns: 1fr;
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
}
</style>
