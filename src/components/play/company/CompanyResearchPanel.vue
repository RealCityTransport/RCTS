<!-- src/components/play/company/CompanyResearchPanel.vue -->
<template>
  <div class="research-root">
    <!-- 상단: 요약 + 액션 -->
    <div class="research-top">
      <div class="top-left">
        <div class="badge">RESEARCH · COMPANY</div>
        <h5 class="title">회사 연구</h5>
        <p class="desc">
          지금은 “보이는 UI”를 먼저 채우는 단계야. 연구 트리/슬롯/효과 요약을
          한 화면에 배치해두고, 나중에 로직만 꽂아 넣으면 바로 살아나게 만들 거야.
        </p>
      </div>

      <div class="top-right">
        <button class="btn btn-primary" type="button" disabled>
          새 연구 선택 (준비중)
        </button>
        <button class="btn btn-ghost" type="button" disabled>
          연구 목록 (준비중)
        </button>
      </div>
    </div>

    <!-- 빠른 상태 요약 카드 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">연구 포인트</div>
        <div class="kpi-value">120</div>
        <div class="kpi-sub">주간 수급 (예정)</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">진행 슬롯</div>
        <div class="kpi-value">1 / 2</div>
        <div class="kpi-sub">해금으로 증가</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">누적 해금</div>
        <div class="kpi-value">3</div>
        <div class="kpi-sub">패시브/기능</div>
      </div>
    </div>

    <!-- 본문 -->
    <div class="main-grid">
      <!-- LEFT: 트리/분야 -->
      <section class="panel">
        <header class="panel-head">
          <div class="panel-title">연구 트리</div>
          <div class="panel-sub">분야별 노드와 선행 조건 UI</div>
        </header>

        <div class="tabs">
          <button
            v-for="t in tracks"
            :key="t.key"
            type="button"
            class="tab"
            :class="{ 'is-active': activeTrack === t.key }"
            @click="activeTrack = t.key"
          >
            {{ t.label }}
          </button>
        </div>

        <div class="tree">
          <div class="tree-row">
            <div class="node is-done">
              <div class="node-name">기초 연구</div>
              <div class="node-meta">완료</div>
            </div>

            <div class="node is-active">
              <div class="node-name">운영 효율 I</div>
              <div class="node-meta">진행중</div>
            </div>

            <div class="node is-locked">
              <div class="node-name">운영 효율 II</div>
              <div class="node-meta">LOCK</div>
            </div>
          </div>

          <div class="tree-row">
            <div class="node is-done">
              <div class="node-name">정비 기본</div>
              <div class="node-meta">완료</div>
            </div>

            <div class="node is-available">
              <div class="node-name">정비 자동화</div>
              <div class="node-meta">선택 가능</div>
            </div>

            <div class="node is-locked">
              <div class="node-name">정비 AI</div>
              <div class="node-meta">LOCK</div>
            </div>
          </div>

          <div class="tree-row">
            <div class="node is-available">
              <div class="node-name">수요 예측</div>
              <div class="node-meta">선택 가능</div>
            </div>

            <div class="node is-locked">
              <div class="node-name">노선 최적화 I</div>
              <div class="node-meta">LOCK</div>
            </div>

            <div class="node is-locked">
              <div class="node-name">노선 최적화 II</div>
              <div class="node-meta">LOCK</div>
            </div>
          </div>
        </div>

        <div class="note">
          <span class="dot"></span>
          <span class="note-text">
            트리 레이아웃은 추후 “선 연결 + 확대/축소 + 필터”로 확장 가능하게 설계할 거야.
          </span>
        </div>
      </section>

      <!-- RIGHT: 진행 슬롯/효과 -->
      <section class="panel">
        <header class="panel-head">
          <div class="panel-title">진행 슬롯</div>
          <div class="panel-sub">동시 진행/대기/잠금 상태 표시</div>
        </header>

        <div class="slot-list">
          <div class="slot-card is-running">
            <div class="slot-top">
              <div class="slot-name">슬롯 A</div>
              <div class="pill pill-running">RUNNING</div>
            </div>

            <div class="slot-research">
              <div class="slot-research-name">운영 효율 I</div>
              <div class="slot-research-sub">운영 비용 -3% (예정)</div>
            </div>

            <div class="progress">
              <div class="progress-bar" style="width: 46%"></div>
            </div>
            <div class="progress-meta">
              <span>진행률 46%</span>
              <span>남은 시간 02:14:00 (더미)</span>
            </div>
          </div>

          <div class="slot-card is-idle">
            <div class="slot-top">
              <div class="slot-name">슬롯 B</div>
              <div class="pill pill-idle">IDLE</div>
            </div>

            <div class="slot-research">
              <div class="slot-research-name">연구 미선택</div>
              <div class="slot-research-sub">여기에 연구를 배정할 수 있어</div>
            </div>

            <button class="btn btn-ghost btn-wide" type="button" disabled>
              연구 배정 (준비중)
            </button>
          </div>
        </div>

        <div class="effects">
          <div class="effects-title">현재 적용 중인 효과</div>

          <div class="effect-grid">
            <div class="effect-card">
              <div class="effect-name">기초 연구</div>
              <div class="effect-desc">기본 해금: 플레이 허브 기능 확장</div>
            </div>

            <div class="effect-card">
              <div class="effect-name">정비 기본</div>
              <div class="effect-desc">차량 정비 비용 -2% (예정)</div>
            </div>

            <div class="effect-card is-dim">
              <div class="effect-name">다음 해금</div>
              <div class="effect-desc">운영 효율 I 완료 시 표시 예정</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 하단 안내 -->
    <div class="footer">
      <span class="dot"></span>
      <span class="footer-text">
        지금은 샘플 UI만 채운 상태야. 다음 단계에서 “연구 데이터 구조 + 진행 시간 + 계정 저장”을 붙이면 된다.
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tracks = [
  { key: 'ops', label: '운영' },
  { key: 'maint', label: '정비' },
  { key: 'route', label: '노선' },
  { key: 'data', label: '데이터' },
]

const activeTrack = ref('ops')
</script>

<style scoped>
.research-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 상단 */

.research-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.top-left {
  flex: 1 1 auto;
  min-width: 260px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.75);
  background: rgba(2, 6, 23, 0.35);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.92);
}

.title {
  margin: 8px 0 4px;
  font-size: 0.9rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.desc {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(226, 232, 240, 0.86);
}

.top-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 버튼 */

.btn {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(248, 250, 252, 0.92);
  opacity: 0.78;
  cursor: not-allowed;
}

.btn-primary {
  border-color: rgba(129, 140, 248, 0.85);
  background: rgba(129, 140, 248, 0.18);
}

.btn-ghost {
  border-color: rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.35);
}

.btn-wide {
  width: 100%;
  padding: 9px 12px;
}

/* KPI */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 12px;
}

.kpi-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.9);
  font-weight: 900;
  text-transform: uppercase;
}

.kpi-value {
  margin-top: 6px;
  font-size: 1.05rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.kpi-sub {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 메인 레이아웃 */

.main-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 10px;
}

.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  overflow: hidden;
}

.panel-head {
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.panel-title {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.95);
}

.panel-sub {
  margin-top: 4px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
}

.tabs {
  display: flex;
  gap: 6px;
  padding: 10px 12px 0;
  flex-wrap: wrap;
}

.tab {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.35);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgba(226, 232, 240, 0.86);
  cursor: pointer;
}

.tab.is-active {
  border-color: rgba(129, 140, 248, 0.85);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(248, 250, 252, 0.96);
}

.tree {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tree-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.node {
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.95);
}

.node-meta {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.78);
  letter-spacing: 0.02em;
}

.node.is-done {
  border-color: rgba(34, 197, 94, 0.55);
  background: rgba(34, 197, 94, 0.08);
}

.node.is-active {
  border-color: rgba(251, 191, 36, 0.7);
  background: rgba(251, 191, 36, 0.1);
}

.node.is-available {
  border-color: rgba(191, 219, 254, 0.65);
  background: rgba(59, 130, 246, 0.08);
}

.node.is-locked {
  opacity: 0.65;
}

/* 노트/푸터 */

.note,
.footer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.22);
  margin: 0 12px 12px;
}

.footer {
  margin: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.35);
}

.note-text,
.footer-text {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.84);
}

/* 슬롯 */

.slot-list {
  padding: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.45);
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.slot-name {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.95);
}

.pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.22);
  color: rgba(226, 232, 240, 0.86);
}

.pill-running {
  border-color: rgba(251, 191, 36, 0.7);
  background: rgba(251, 191, 36, 0.12);
  color: rgba(248, 250, 252, 0.92);
}

.pill-idle {
  border-color: rgba(191, 219, 254, 0.65);
  background: rgba(59, 130, 246, 0.08);
}

.slot-research-name {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
}

.slot-research-sub {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.76);
}

.progress {
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(2, 6, 23, 0.35);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.95),
    rgba(129, 140, 248, 0.95)
  );
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 효과 */

.effects {
  padding: 10px 12px 12px;
}

.effects-title {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
  margin-bottom: 8px;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.effect-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 6, 23, 0.28);
  padding: 10px 10px;
}

.effect-name {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
  margin-bottom: 4px;
}

.effect-desc {
  font-size: 0.72rem;
  line-height: 1.5;
  color: rgba(226, 232, 240, 0.78);
}

.effect-card.is-dim {
  opacity: 0.72;
}

/* 반응형 */

@media (max-width: 980px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .tree-row {
    grid-template-columns: 1fr;
  }

  .effect-grid {
    grid-template-columns: 1fr;
  }

  .note {
    margin: 0 12px 12px;
  }
}
</style>
