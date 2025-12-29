<!-- src/components/main/MainWikiPage.vue -->
<template>
  <div class="wiki-page">
    <!-- 상단 헤더 -->
    <header class="wiki-header">
      <div class="wiki-title-row">
        <h2 class="wiki-title">RCTS 위키</h2>
        <span class="wiki-badge">INTERNAL DOCS</span>
      </div>
      <p class="wiki-desc">
        RCTS의 규칙, 시스템, 설계 철학을 정리해 두는 내부 위키입니다.<br />
        운송·연구·건설·재정 시스템과 관련된 개념/공식/운영 메모를 여기서 찾아볼 수 있습니다.
      </p>
    </header>

    <!-- 본문 레이아웃: 좌측 네비 / 우측 내용 -->
    <section class="wiki-layout">
      <!-- 좌측: 카테고리 / 문서 목록 -->
      <aside class="wiki-nav">
        <h3 class="nav-title">카테고리</h3>
        <ul class="nav-section">
          <li class="nav-section-title">운송 시스템</li>
          <li class="nav-item">· 기본 운행 규칙</li>
          <li class="nav-item">· 슬롯/주기/혼잡도 개념</li>
          <li class="nav-item">· 승하차/수익 계산 요약</li>
        </ul>

        <ul class="nav-section">
          <li class="nav-section-title">연구 · 개발</li>
          <li class="nav-item">· 연구 카탈로그 개요</li>
          <li class="nav-item">· 연구 효과 정리</li>
          <li class="nav-item">· 추천 연구 루트</li>
        </ul>

        <ul class="nav-section">
          <li class="nav-section-title">건설 · 인프라</li>
          <li class="nav-item">· 역/정류장 배치 규칙</li>
          <li class="nav-item">· 차량기지/차고 설계</li>
          <li class="nav-item">· 향후 타일 시스템 메모</li>
        </ul>

        <ul class="nav-section">
          <li class="nav-section-title">재정 · 운영</li>
          <li class="nav-item">· 자금 흐름 구조</li>
          <li class="nav-item">· 방치형 · 본게임 연동</li>
          <li class="nav-item">· 운영 지표 정의</li>
        </ul>
      </aside>

      <!-- 우측: 내용 영역(지금은 인트로용 더미) -->
      <article class="wiki-content">
        <h3 class="content-title">위키 사용 가이드 (초기 버전)</h3>
        <p class="content-text">
          지금은 RCTS 위키의 뼈대만 잡아둔 상태입니다. 각 항목은 나중에 실제 문서로 연결되거나,
          Firestore에 저장된 마크다운/리치텍스트 문서를 로딩하는 방식으로 확장할 수 있습니다.
        </p>

        <p class="content-text">
          단기적으로는, 이 영역에 설계 메모와 규칙 요약을 정리해 두고,
          커뮤니티/로그/운영 노트에서 해당 문서를 참조하는 형태로 사용하면 좋습니다.
        </p>

        <section class="content-section">
          <h4 class="section-title">향후 확장 아이디어</h4>
          <ul class="section-list">
            <li>· Firestore 컬렉션 <code>wiki_pages</code>로 문서 관리</li>
            <li>· 문서별 <code>slug / title / category / body / updatedAt</code> 필드 설계</li>
            <li>· 위키 편집 전용 관리자 화면(초기엔 내부용만)</li>
            <li>· 게임 내 툴팁/설명에서 위키 문서로 딥링크</li>
          </ul>
        </section>

        <section class="content-section">
          <h4 class="section-title">지금 단계에서 할 일</h4>
          <ul class="section-list">
            <li>· 운송/연구/건설/재정 각 파트별 “1차 요약 문서”부터 채우기</li>
            <li>· 플레이 중 자주 궁금해지는 규칙을 목록으로 모으기</li>
            <li>· 나중에 데이터 구조와 UI를 분리하기 쉽게, 문서 단위를 기준으로 생각해 두기</li>
          </ul>
        </section>
      </article>
    </section>
  </div>
</template>

<script setup>
// 현재는 순수 레이아웃 컴포넌트
// 이후 Firestore 연동, 문서 선택/로드 로직 등을 여기서 추가하면 됨
</script>

<style scoped>
.wiki-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 상단 헤더 */

.wiki-header {
  padding: 12px 12px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.wiki-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.wiki-title {
  font-size: 1rem;
  font-weight: 700;
}

.wiki-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(129, 140, 248, 0.16);
  letter-spacing: 0.08em;
}

.wiki-desc {
  font-size: 0.82rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 본문 레이아웃 */

.wiki-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

/* 좌측 네비 */

.wiki-nav {
  padding: 12px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.8rem;
}

.nav-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.nav-section {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
}

.nav-section-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.nav-item {
  opacity: 0.9;
  line-height: 1.5;
}

/* 우측 내용 */

.wiki-content {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
}

.content-title {
  font-size: 0.94rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.content-text {
  margin-bottom: 8px;
  line-height: 1.6;
  opacity: 0.95;
}

.content-section {
  margin-top: 8px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.section-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.section-list li {
  line-height: 1.5;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.78rem;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
}

/* 반응형 */

@media (min-width: 864px) {
  .wiki-layout {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
  }
}
</style>
