<!-- src/components/play/operations/OperationsPage.vue -->
<template>
  <div class="ops-root">
    <!-- 상단 -->
    <header class="ops-header">
      <div class="ops-header-left">
        <div class="badge">OPERATIONS · CENTER</div>
        <h3 class="ops-title">운영 센터</h3>
        <p class="ops-sub">
          노선·차량이 실제로 “움직이는 상태”를 한눈에 보는 관제 화면.
          지금은 UI/레이아웃 고정용 더미 상태야.
        </p>
      </div>

      <nav class="ops-menu" aria-label="운영 센터 메뉴">
        <button
          type="button"
          class="ops-menu-item"
          :class="{ 'is-active': activeSection === 'control' }"
          @click="activeSection = 'control'"
        >
          관제
        </button>
        <button
          type="button"
          class="ops-menu-item"
          :class="{ 'is-active': activeSection === 'routes' }"
          @click="activeSection = 'routes'"
        >
          노선
        </button>
        <button
          type="button"
          class="ops-menu-item"
          :class="{ 'is-active': activeSection === 'vehicles' }"
          @click="activeSection = 'vehicles'"
        >
          차량
        </button>
      </nav>
    </header>

    <!-- KPI -->
    <section class="kpi-grid">
      <article class="kpi-card">
        <div class="kpi-label">현재 운행</div>
        <div class="kpi-value">12</div>
        <div class="kpi-sub">활성 차량 기준 (더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">지연</div>
        <div class="kpi-value">2</div>
        <div class="kpi-sub">경미/중대 포함 (더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">혼잡</div>
        <div class="kpi-value">High</div>
        <div class="kpi-sub">피크 타임(더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">알림</div>
        <div class="kpi-value">5</div>
        <div class="kpi-sub">이벤트/경고 (더미)</div>
      </article>
    </section>

    <!-- 본문 -->
    <main class="ops-body">
      <OperationsControlPanel v-if="activeSection === 'control'" />
      <OperationsRoutesPanel v-else-if="activeSection === 'routes'" />
      <OperationsVehiclesPanel v-else />
    </main>

    <!-- 하단 안내 -->
    <div class="footer">
      <span class="dot"></span>
      <span class="footer-text">
        이 운영 센터는 이후 “실시간(틱) 진행 + 노선 스케줄 + 차량 상태”가 붙는 메인 화면이 될 거야.
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OperationsControlPanel from './OperationsControlPanel.vue'
import OperationsRoutesPanel from './OperationsRoutesPanel.vue'
import OperationsVehiclesPanel from './OperationsVehiclesPanel.vue'

const activeSection = ref('control')
</script>

<style scoped>
.ops-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 헤더 */

.ops-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.ops-header-left {
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

.ops-title {
  margin: 8px 0 4px;
  font-size: 0.95rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.ops-sub {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(226, 232, 240, 0.86);
}

/* 상단 메뉴 */

.ops-menu {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.35);
}

.ops-menu-item {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.25);

  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgba(226, 232, 240, 0.86);

  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.ops-menu-item:hover {
  border-color: rgba(191, 219, 254, 0.8);
  background: rgba(15, 23, 42, 0.55);
}

.ops-menu-item.is-active {
  border-color: rgba(129, 140, 248, 0.85);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(248, 250, 252, 0.96);
  transform: translateY(-1px);
}

/* KPI */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

/* 본문 */

.ops-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

/* 하단 */

.footer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.22);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.35);
}

.footer-text {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.84);
}

/* 반응형 */

@media (max-width: 980px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
