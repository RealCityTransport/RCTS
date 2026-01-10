<!-- src/components/community/communitypage.vue -->
<template>
  <section class="community-shell">
    <!-- Global Topbar -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark">R</div>
          <div class="brand-text">
            <div class="brand-kicker">RCTS</div>
            <div class="brand-title">Community</div>
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

        <nav class="top-actions" aria-label="커뮤니티 상단 액션">
          <router-link to="/" class="btn btn-ghost">← Home</router-link>
          <button class="btn btn-primary" type="button" disabled>새 글</button>
        </nav>
      </div>
    </header>

    <!-- Layout -->
    <div class="layout">
      <div class="layout-inner">
        <!-- Sidebar -->
        <aside class="sidebar" aria-label="커뮤니티 내비게이션">
          <div class="side-card">
            <div class="side-title">Community</div>
            <p class="side-sub">
              커뮤니티/소통 허브.
              <span class="side-sub-weak">(초기엔 링크/공지 중심 → 추후 포럼/댓글 확장)</span>
            </p>
          </div>

          <div class="side-section">
            <div class="side-section-title">카테고리</div>
            <div class="side-links">
              <a class="side-link is-active" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                전체
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                공지
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                자유
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                제안/피드백
              </a>
              <a class="side-link" href="#" @click.prevent>
                <span class="dot" aria-hidden="true"></span>
                버그/리포트
              </a>
            </div>
          </div>

          <div class="side-section">
            <div class="side-section-title">정렬</div>
            <div class="filter-row">
              <button class="filter-pill is-active" type="button" disabled>최신</button>
              <button class="filter-pill" type="button" disabled>인기</button>
              <button class="filter-pill" type="button" disabled>활동</button>
            </div>
          </div>

          <div class="side-section">
            <div class="side-section-title">태그</div>
            <div class="pill-grid">
              <span class="pill">Announcement</span>
              <span class="pill">Feedback</span>
              <span class="pill">Bug</span>
              <span class="pill">Showcase</span>
              <span class="pill">Question</span>
              <span class="pill">Guide</span>
            </div>
          </div>

          <div class="side-footer">
            <div class="side-footer-row">
              <span class="side-footer-label">상태</span>
              <span class="side-footer-value">초기 구성</span>
            </div>
            <div class="side-footer-row">
              <span class="side-footer-label">스레드</span>
              <span class="side-footer-value">0</span>
            </div>
            <div class="side-footer-row">
              <span class="side-footer-label">멤버</span>
              <span class="side-footer-value">—</span>
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
              <span class="crumb is-current">Community</span>
            </div>

            <div class="page-title-row">
              <h1 class="page-title">커뮤니티</h1>
              <div class="page-meta">
                <span class="meta-item">정렬: 최신</span>
                <span class="meta-sep">·</span>
                <span class="meta-item">상태: 준비 중</span>
              </div>
            </div>

            <div class="notice">
              <span class="notice-dot" aria-hidden="true"></span>
              <span class="notice-text">
                지금은 “링크 허브 + 공지 + 스레드 프리뷰” 형태로 운영감 먼저 잡는 단계야.
                나중에 내부 게시판/댓글/알림을 붙이면 완성.
              </span>
            </div>
          </div>

          <!-- Top widgets -->
          <section class="widgets" aria-label="커뮤니티 요약">
            <article class="widget-card">
              <div class="widget-label">공지</div>
              <div class="widget-value">1</div>
              <div class="widget-sub">고정 안내(더미)</div>
            </article>

            <article class="widget-card">
              <div class="widget-label">오늘 활동</div>
              <div class="widget-value">0</div>
              <div class="widget-sub">댓글/글(더미)</div>
            </article>

            <article class="widget-card">
              <div class="widget-label">피드백</div>
              <div class="widget-value">0</div>
              <div class="widget-sub">제안/버그(더미)</div>
            </article>

            <article class="widget-card">
              <div class="widget-label">채널</div>
              <div class="widget-value">4</div>
              <div class="widget-sub">연동 예정</div>
            </article>
          </section>

          <!-- Main grid -->
          <section class="content-grid" aria-label="커뮤니티 본문">
            <!-- Left: Feed / Threads -->
            <div class="col">
              <article class="panel">
                <div class="panel-head">
                  <div class="panel-title">공지</div>
                  <span class="panel-badge">Pinned</span>
                </div>

                <div class="announce">
                  <div class="announce-title">커뮤니티 운영 가이드 (준비 중)</div>
                  <div class="announce-sub">
                    규칙/공지/링크를 먼저 고정하고, 내부 게시판은 이후 단계에서 확장할 예정.
                  </div>
                  <div class="announce-actions">
                    <button class="mini-btn" type="button" disabled>자세히</button>
                    <span class="tag">Announcement</span>
                    <span class="tag">Guide</span>
                  </div>
                </div>
              </article>

              <article class="panel">
                <div class="panel-head">
                  <div class="panel-title">스레드</div>
                  <span class="panel-badge is-soft">Preview</span>
                </div>

                <div class="thread-list">
                  <div class="thread">
                    <div class="thread-main">
                      <div class="thread-title">[질문] 노선/차량/운영 연결 계획</div>
                      <div class="thread-sub">
                        내부 데이터 연결 전에 UI를 어디까지 고정할지에 대한 논의(더미)
                      </div>
                      <div class="thread-meta">
                        <span class="meta-chip">Question</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">0 댓글</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">마지막 활동: —</span>
                      </div>
                    </div>
                    <button class="thread-go" type="button" disabled>열기</button>
                  </div>

                  <div class="thread">
                    <div class="thread-main">
                      <div class="thread-title">[제안] 공항/정류장 데이터 커뮤니티 반영 방식</div>
                      <div class="thread-sub">
                        유저 제출 → 검수/승인 → 반영 프로세스(더미)
                      </div>
                      <div class="thread-meta">
                        <span class="meta-chip">Feedback</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">0 댓글</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">마지막 활동: —</span>
                      </div>
                    </div>
                    <button class="thread-go" type="button" disabled>열기</button>
                  </div>

                  <div class="thread">
                    <div class="thread-main">
                      <div class="thread-title">[버그] 모바일에서 스크롤/레이아웃 이슈</div>
                      <div class="thread-sub">
                        이중 스크롤바/높이 100% 관련(더미)
                      </div>
                      <div class="thread-meta">
                        <span class="meta-chip">Bug</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">0 댓글</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-chip">마지막 활동: —</span>
                      </div>
                    </div>
                    <button class="thread-go" type="button" disabled>열기</button>
                  </div>
                </div>

                <div class="empty">
                  <div class="empty-icon" aria-hidden="true">💬</div>
                  <div class="empty-title">내부 게시판 연결 준비 중</div>
                  <div class="empty-sub">
                    다음 단계: 스레드 리스트 컴포넌트 분리 → 라우팅(상세) → 댓글/작성 UI
                  </div>
                </div>
              </article>
            </div>

            <!-- Right: Channels / Links -->
            <div class="col">
              <article class="panel">
                <div class="panel-head">
                  <div class="panel-title">소통 채널</div>
                  <span class="panel-badge is-soft">Link Hub</span>
                </div>

                <div class="channel-grid">
                  <div class="channel">
                    <div class="channel-top">
                      <div class="channel-name">Discord</div>
                      <span class="channel-pill">Soon</span>
                    </div>
                    <div class="channel-desc">연동 예정</div>
                    <button class="channel-btn" type="button" disabled>Open</button>
                  </div>

                  <div class="channel">
                    <div class="channel-top">
                      <div class="channel-name">Forum</div>
                      <span class="channel-pill">Soon</span>
                    </div>
                    <div class="channel-desc">연동 예정</div>
                    <button class="channel-btn" type="button" disabled>Open</button>
                  </div>

                  <div class="channel">
                    <div class="channel-top">
                      <div class="channel-name">Chat</div>
                      <span class="channel-pill">Soon</span>
                    </div>
                    <div class="channel-desc">연동 예정</div>
                    <button class="channel-btn" type="button" disabled>Open</button>
                  </div>

                  <div class="channel">
                    <div class="channel-top">
                      <div class="channel-name">Feedback</div>
                      <span class="channel-pill">Soon</span>
                    </div>
                    <div class="channel-desc">연동 예정</div>
                    <button class="channel-btn" type="button" disabled>Open</button>
                  </div>
                </div>

                <div class="link-note">
                  <span class="link-dot" aria-hidden="true"></span>
                  <span class="link-note-text">
                    초기엔 “링크 허브”로 운영하고, 이후 내부 포럼으로 확장하면 흐름이 자연스러워.
                  </span>
                </div>
              </article>

              <article class="panel">
                <div class="panel-head">
                  <div class="panel-title">개발/운영 노트</div>
                  <span class="panel-badge">Plan</span>
                </div>

                <p class="panel-text">
                  커뮤니티 페이지는 “연결 지점”을 먼저 만들고,
                  나중에 게시판/댓글/알림을 붙이는 구조가 가장 안전해.
                </p>

                <div class="panel-actions">
                  <button class="mini-btn" type="button" disabled>로드맵</button>
                  <span class="tag">Plan</span>
                  <span class="tag">Operations</span>
                </div>
              </article>
            </div>
          </section>

          <!-- Footer -->
          <footer class="footer">
            <div class="footer-inner">
              <div class="footer-left">
                <div class="footer-brand">RCTS Community</div>
                <div class="footer-sub">공지 · 피드백 · 소통 채널 · 포럼 확장 예정</div>
              </div>
              <div class="footer-right">
                <span class="footer-chip">Threads</span>
                <span class="footer-chip">Channels</span>
                <span class="footer-chip">Rules</span>
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
.community-shell {
  min-height: 100vh;
  color: rgba(255, 255, 255, 0.92);
  background:
    radial-gradient(1200px 520px at 20% -10%, rgba(99, 102, 241, 0.18), transparent 70%),
    radial-gradient(900px 420px at 85% 0%, rgba(56, 189, 248, 0.14), transparent 65%),
    radial-gradient(circle at top, #0b1220 0%, #05070d 62%, #000 100%);
}

/* =========
   Topbar (Wiki/Devlog과 동일 톤)
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
  background: linear-gradient(
    135deg,
    rgba(56, 189, 248, 0.95) 0%,
    rgba(99, 102, 241, 0.95) 45%,
    rgba(168, 85, 247, 0.95) 100%
  );
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
   Widgets
   ========= */
.widgets {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.widget-card {
  border-radius: 18px;
  padding: 14px 14px;
  background: rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.widget-label {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
  font-weight: 900;
}

.widget-value {
  margin-top: 8px;
  font-size: 1.05rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.widget-sub {
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 800;
}

/* =========
   Content grid
   ========= */
.content-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 12px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel {
  border-radius: 18px;
  padding: 16px 16px;
  background: rgba(2, 6, 23, 0.36);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

.panel-badge {
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

.panel-badge.is-soft {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.28);
  color: rgba(226, 232, 240, 0.86);
}

.panel-text {
  margin: 0;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.75;
  font-size: 0.86rem;
}

.panel-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* =========
   Announcement
   ========= */
.announce {
  border-radius: 16px;
  padding: 14px 14px;
  background: rgba(15, 23, 42, 0.26);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.announce-title {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
  font-size: 0.9rem;
}

.announce-sub {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.74);
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.65;
}

.announce-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* =========
   Threads
   ========= */
.thread-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thread {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.24);
}

.thread-main {
  min-width: 0;
}

.thread-title {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
  font-size: 0.88rem;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-sub {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.55;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.thread-meta {
  margin-top: 10px;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.meta-chip {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.78);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.18);
}

.meta-dot {
  opacity: 0.5;
}

.thread-go {
  flex: 0 0 auto;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.75;
}

/* =========
   Channels
   ========= */
.channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel {
  border-radius: 16px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.24);
  border: 1px solid rgba(148, 163, 184, 0.16);
  display: grid;
  gap: 8px;
}

.channel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.channel-name {
  font-weight: 900;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.94);
}

.channel-pill {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.2);
  color: rgba(226, 232, 240, 0.82);
  font-weight: 900;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.channel-desc {
  color: rgba(226, 232, 240, 0.74);
  font-size: 0.84rem;
  font-weight: 800;
}

.channel-btn {
  margin-top: 2px;
  border-radius: 14px;
  padding: 10px 10px;
  background: rgba(2, 6, 23, 0.22);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  cursor: not-allowed;
  opacity: 0.75;
}

.channel-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.link-note {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(129, 140, 248, 0.22);
  background: rgba(129, 140, 248, 0.08);
}

.link-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.25);
}

.link-note-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.55;
}

/* =========
   Empty
   ========= */
.empty {
  margin-top: 12px;
  border-radius: 18px;
  padding: 18px 16px;
  background: rgba(15, 23, 42, 0.22);
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
   Small components shared
   ========= */
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.55));
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

  .widgets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
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

  .widgets {
    grid-template-columns: 1fr;
  }

  .channel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
