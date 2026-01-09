<!-- src/components/play/operations/OperationsControlPanel.vue -->
<template>
  <div class="control-root">
    <section class="panel panel-main">
      <header class="panel-head">
        <div class="panel-title">관제 보드</div>
        <div class="panel-sub">
          “지금 이 순간” 운행/지연/이벤트를 한 화면에 모아보는 핵심 영역
        </div>
      </header>

      <div class="main-grid">
        <!-- LEFT: 라이브 상태 -->
        <div class="card">
          <div class="card-title">라이브 상태</div>
          <div class="live-list">
            <div class="live-row">
              <span class="pill pill-ok">OK</span>
              <span class="live-text">노선 A-01 · 정상 운행</span>
              <span class="live-meta">1분 전</span>
            </div>
            <div class="live-row">
              <span class="pill pill-warn">DELAY</span>
              <span class="live-text">노선 B-03 · 4분 지연</span>
              <span class="live-meta">방금</span>
            </div>
            <div class="live-row">
              <span class="pill pill-warn">CROWD</span>
              <span class="live-text">노선 C-02 · 혼잡 상승</span>
              <span class="live-meta">3분 전</span>
            </div>
            <div class="live-row is-dim">
              <span class="pill">INFO</span>
              <span class="live-text">이벤트 로그가 여기에 계속 쌓임</span>
              <span class="live-meta">더미</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: 타임라인/지표 -->
        <div class="card">
          <div class="card-title">피크 타임 흐름 (더미)</div>

          <div class="mini-chart">
            <div class="bar" style="height: 28%"></div>
            <div class="bar" style="height: 52%"></div>
            <div class="bar" style="height: 66%"></div>
            <div class="bar" style="height: 40%"></div>
            <div class="bar" style="height: 58%"></div>
            <div class="bar" style="height: 74%"></div>
            <div class="bar" style="height: 46%"></div>
            <div class="bar" style="height: 32%"></div>
          </div>

          <div class="chart-meta">
            <span>혼잡도</span>
            <span>지연</span>
            <span>운행량</span>
          </div>

          <div class="hint">
            <span class="dot"></span>
            <span class="hint-text">
              나중에 여기는 “실제 틱 기반 차트/라인”으로 바뀔 자리야.
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="panel panel-sub">
      <div class="sub-grid">
        <div class="sub-card">
          <div class="sub-title">빠른 조치 (준비중)</div>
          <ul class="sub-list">
            <li>긴급 증차</li>
            <li>운행 간격 조정</li>
            <li>임시 우회</li>
          </ul>
        </div>

        <div class="sub-card">
          <div class="sub-title">알림 필터 (준비중)</div>
          <ul class="sub-list">
            <li>지연만 보기</li>
            <li>혼잡만 보기</li>
            <li>사고/공사만 보기</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.control-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: radial-gradient(
    circle at top left,
    rgba(56, 189, 248, 0.10),
    rgba(15, 23, 42, 0.98)
  );
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.55);
}

.panel-head {
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.panel-title {
  font-size: 0.88rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.panel-sub {
  margin-top: 4px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.5;
}

.panel-main {
  overflow: hidden;
}

.main-grid {
  padding: 10px 12px 12px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 10px;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 10px;
}

.card-title {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
  margin-bottom: 8px;
}

/* 라이브 리스트 */

.live-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;

  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
}

.live-row.is-dim {
  opacity: 0.75;
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

.pill-ok {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(34, 197, 94, 0.10);
}

.pill-warn {
  border-color: rgba(251, 191, 36, 0.7);
  background: rgba(251, 191, 36, 0.12);
  color: rgba(248, 250, 252, 0.92);
}

.live-text {
  font-size: 0.78rem;
  font-weight: 800;
  color: rgba(248, 250, 252, 0.92);
}

.live-meta {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 차트 더미 */

.mini-chart {
  height: 120px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.25);

  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 10px 10px;
}

.bar {
  flex: 1;
  border-radius: 10px;
  border: 1px solid rgba(129, 140, 248, 0.35);
  background: rgba(129, 140, 248, 0.16);
}

.chart-meta {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.78);
}

.hint {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.22);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.35);
}

.hint-text {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.84);
}

/* 서브 */

.panel-sub {
  padding: 10px 12px 12px;
}

.sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sub-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 10px;
}

.sub-title {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
  margin-bottom: 6px;
}

.sub-list {
  margin: 0;
  padding-left: 16px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.6;
}

/* 반응형 */

@media (max-width: 980px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .sub-grid {
    grid-template-columns: 1fr;
  }
}
</style>
