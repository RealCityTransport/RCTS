<!-- src/components/play/operations/OperationsVehiclesPanel.vue -->
<template>
  <section class="panel">
    <header class="panel-head">
      <div class="panel-title">차량 운영</div>
      <div class="panel-sub">
        가동/대기/정비 상태를 운영 관점에서 묶어서 보는 화면. 이후 차량 모듈을 재사용할 예정.
      </div>
    </header>

    <div class="body">
      <div class="grid">
        <div class="card">
          <div class="card-title">상태 요약</div>

          <div class="stat-row">
            <span class="label">가동</span>
            <span class="value">12</span>
          </div>
          <div class="stat-row">
            <span class="label">대기</span>
            <span class="value">4</span>
          </div>
          <div class="stat-row">
            <span class="label">정비</span>
            <span class="value">1</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">주의 차량</div>

          <div class="row">
            <span class="pill pill-warn">CHECK</span>
            <span class="txt">V-014</span>
            <span class="meta">정비 임박</span>
          </div>
          <div class="row">
            <span class="pill pill-warn">DELAY</span>
            <span class="txt">V-021</span>
            <span class="meta">지연 유발</span>
          </div>

          <div class="hint">실제 구현 시: 차량 목록/정비 모듈 연결</div>
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

.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
  margin-bottom: 8px;
}

.label {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  font-weight: 800;
}

.value {
  font-size: 0.9rem;
  color: rgba(248, 250, 252, 0.94);
  font-weight: 900;
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
