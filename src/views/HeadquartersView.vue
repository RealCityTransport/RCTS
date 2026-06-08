<template>
  <section class="page-stack">
    <div v-if="!state.companyCreated" class="start-card panel">
      <p class="eyebrow">RCTS Lite</p>
      <h1>가상 운송회사를 시작합니다</h1>
      <p class="muted">초기 자금은 중형버스 2대 구입이 가능한 수준으로 시작합니다.</p>

      <form class="start-form" @submit.prevent="handleCreateCompany">
        <label>
          <span>회사명</span>
          <input v-model="companyName" type="text" placeholder="예: 리얼시티 운송" />
        </label>
        <button type="submit">회사 생성</button>
      </form>
    </div>

    <template v-else>
      <section class="hero panel">
        <div>
          <p class="eyebrow">본부</p>
          <h1>{{ state.companyName }}</h1>
          <p class="muted">버스와 선박은 간단히, 철도는 노선 운행, 항공은 공항 건설부터 시작합니다.</p>
        </div>
        <button class="danger ghost" type="button" @click="resetCompany">회사 초기화</button>
      </section>

      <section class="stats-grid">
        <article class="panel stat-card">
          <span>보유 자금</span>
          <strong>{{ formatMoney(state.money) }}</strong>
        </article>
        <article class="panel stat-card">
          <span>보유 차량</span>
          <strong>{{ state.ownedVehicles.length }}대</strong>
        </article>
        <article class="panel stat-card">
          <span>철도 노선</span>
          <strong>{{ state.railRoutes.length }}개</strong>
        </article>
        <article class="panel stat-card">
          <span>보유 공항</span>
          <strong>{{ state.airports.length }}개</strong>
        </article>
        <article class="panel stat-card">
          <span>진행 중 운행</span>
          <strong>{{ runningOperations.length }}건</strong>
        </article>
        <article class="panel stat-card">
          <span>정산 대기</span>
          <strong>{{ settlementQueue.length }}건</strong>
        </article>
      </section>

      <section class="grid-two">
        <article class="panel">
          <div class="section-title">
            <div>
              <p class="eyebrow">곧 마무리</p>
              <h2>운행 현황</h2>
            </div>
          </div>

          <div v-if="runningOperations.length === 0" class="empty">진행 중인 운행이 없습니다.</div>
          <div v-else class="mini-list">
            <div v-for="operation in runningOperations.slice(0, 5)" :key="operation.id" class="mini-item">
              <div>
                <strong>{{ operation.title }}</strong>
                <span>{{ operation.vehicleName }}</span>
              </div>
              <b>{{ formatDuration((operation.endsAt - state.tickNow) / 1000) }}</b>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="section-title">
            <div>
              <p class="eyebrow">정산</p>
              <h2>대기 수익</h2>
            </div>
          </div>

          <div v-if="settlementQueue.length === 0" class="empty">정산 대기 항목이 없습니다.</div>
          <div v-else class="mini-list">
            <div v-for="settlement in settlementQueue.slice(0, 5)" :key="settlement.id" class="mini-item">
              <div>
                <strong>{{ settlement.title }}</strong>
                <span>{{ settlement.vehicleName }} · {{ settlement.passengers }}명</span>
              </div>
              <b>{{ formatMoney(settlement.revenue) }}</b>
            </div>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { rctsLiteManager } from '../stores/rctsLiteManager'
import { formatDuration, formatMoney } from '../modules/time'

const state = rctsLiteManager.state
const companyName = ref('')

const runningOperations = computed(() => rctsLiteManager.getters.runningOperations.value)
const settlementQueue = computed(() => rctsLiteManager.getters.settlementQueue.value)

const handleCreateCompany = () => {
  rctsLiteManager.createCompany(companyName.value)
}

const resetCompany = () => {
  if (window.confirm('현재 회사를 초기화하고 처음부터 다시 시작할까요?')) {
    rctsLiteManager.resetCompany()
    companyName.value = ''
  }
}
</script>

<style scoped>
.page-stack { display: grid; gap: 18px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); box-shadow: 0 20px 55px rgba(0, 0, 0, 0.18); }
.start-card { display: grid; gap: 16px; max-width: 720px; margin: 7vh auto 0; padding: 32px; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
h1, h2 { margin: 0; letter-spacing: -0.03em; }
h1 { font-size: clamp(30px, 5vw, 56px); }
h2 { font-size: 20px; }
.muted { margin: 8px 0 0; color: #94a3b8; line-height: 1.6; }
.start-form { display: grid; gap: 12px; margin-top: 8px; }
label { display: grid; gap: 8px; color: #cbd5e1; font-size: 13px; font-weight: 700; }
input { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 14px; outline: none; color: #e5e7eb; background: rgba(2, 6, 23, 0.45); }
button { min-height: 46px; padding: 0 18px; border: 0; border-radius: 14px; color: white; font-weight: 800; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
button.ghost { background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(148, 163, 184, 0.2); }
button.danger { color: #fecaca; }
.hero { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding: 26px; }
.stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
.stat-card { display: grid; gap: 6px; padding: 20px; }
.stat-card span { color: #94a3b8; font-size: 13px; }
.stat-card strong { color: #e0f2fe; font-size: 26px; }
.grid-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.grid-two > .panel { padding: 22px; }
.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.empty { padding: 18px; border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; color: #94a3b8; text-align: center; }
.mini-list { display: grid; gap: 10px; }
.mini-item { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 13px 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.62); }
.mini-item div { display: grid; gap: 3px; }
.mini-item span { color: #94a3b8; font-size: 12px; }
.mini-item b { color: #bfdbfe; white-space: nowrap; }
@media (max-width: 980px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) { .hero { flex-direction: column; } .stats-grid, .grid-two { grid-template-columns: 1fr; } .start-card { padding: 24px; margin-top: 2vh; } }
</style>
