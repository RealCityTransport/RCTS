<!-- src/components/play/operations/OperationsRoutesPanel.vue -->
<template>
  <section class="panel">
    <header class="panel-head">
      <div class="panel-title">노선 운영</div>
      <div class="panel-sub">
        운영 관점에서 노선 상태(혼잡/지연/운행 간격)를 모아서 보는 화면.
        이후에는 “노선 모듈”을 그대로 꽂아 재사용할 거야.
      </div>
    </header>

    <div class="body">
      <div class="grid">
        <div class="card">
          <div class="card-title">핵심 노선</div>
          <div class="row"><span class="pill">OK</span><span class="txt">A-01</span><span class="meta">혼잡: 보통</span></div>
          <div class="row"><span class="pill pill-warn">DELAY</span><span class="txt">B-03</span><span class="meta">지연: 4분</span></div>
          <div class="row"><span class="pill pill-warn">CROWD</span><span class="txt">C-02</span><span class="meta">혼잡: 높음</span></div>
        </div>

        <div class="card">
          <div class="card-title">운행 간격</div>
          <div class="meter">
            <div class="meter-label">평균 간격</div>
            <div class="meter-value">7.5분</div>
          </div>
          <div class="meter">
            <div class="meter-label">피크 간격</div>
            <div class="meter-value">5.0분</div>
          </div>
          <div class="hint">
            실제 구현 시: 노선 편집 모듈 + 운영 지표를 합쳐 표시
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: radial-gradient(
    circle at top left,
    rgba(56, 189, 248, 0.10),
    rgba(15, 23, 42, 0.98)
  );
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.55);
  overflow: hidden;
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

.body {
  padding: 10px 12px 12px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  color: rgba(248, 250, 252, 0.92);
  margin-bottom: 8px;
}

.row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
  margin-bottom: 8px;
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

.pill-warn {
  border-color: rgba(251, 191, 36, 0.7);
  background: rgba(251, 191, 36, 0.12);
  color: rgba(248, 250, 252, 0.92);
}

.txt {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
}

.meta {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.76);
  text-align: right;
}

.meter {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
  margin-bottom: 8px;
}

.meter-label {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  font-weight: 800;
}

.meter-value {
  font-size: 0.86rem;
  color: rgba(248, 250, 252, 0.94);
  font-weight: 900;
}

.hint {
  margin-top: 6px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.5;
  opacity: 0.92;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
