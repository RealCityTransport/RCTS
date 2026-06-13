<template>
  <section class="page-stack">
    <div class="page-head panel">
      <div>
        <p class="eyebrow">항공</p>
        <h1>공항 건설 / 관제 준비</h1>
      </div>
      <div class="money">{{ formatMoney(state.money) }}</div>
    </div>

    <div v-if="!state.companyCreated" class="panel empty">본부에서 회사를 먼저 생성하세요.</div>

    <template v-else>
      <section class="airport-grid">
        <article v-for="airport in rctsLiteManager.airportCatalog" :key="airport.id" class="airport-card panel">
          <div>
            <p class="eyebrow">공항 건설</p>
            <h2>{{ airport.name }}</h2>
            <span>{{ airport.runwayCount }}활주로 · {{ airport.standCount }}스탠드</span>
          </div>

          <p>{{ airport.description }}</p>

          <div class="price-row">
            <span>건설비</span>
            <b>{{ formatMoney(airport.price) }}</b>
          </div>

          <div class="price-row">
            <span>건설시간</span>
            <b>{{ formatDuration(airport.buildSeconds) }}</b>
          </div>

          <label>
            <span>공항명</span>
            <input v-model="draftNames[airport.id]" type="text" :placeholder="airport.name" />
          </label>

          <button type="button" :disabled="state.money < airport.price || state.airportProjects.length > 0" @click="buildAirport(airport.id)">
            건설 시작
          </button>
        </article>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">진행</p>
            <h2>공항 건설 현황</h2>
          </div>
        </div>

        <div v-if="airportProjects.length === 0" class="empty inner">진행 중인 공항 건설이 없습니다.</div>
        <div v-else class="project-list">
          <article v-for="project in airportProjects" :key="project.id" class="project-card">
            <div class="project-top">
              <div>
                <strong>{{ project.name }}</strong>
                <span>{{ project.runwayCount }}활주로 · {{ project.standCount }}스탠드</span>
              </div>
              <b>{{ formatDuration((project.endsAt - state.tickNow) / 1000) }}</b>
            </div>
            <div class="progress-bar"><i :style="{ width: `${progressPercent(project)}%` }"></i></div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">완성</p>
            <h2>보유 공항</h2>
          </div>
        </div>

        <div v-if="state.airports.length === 0" class="empty inner">완성된 공항이 없습니다.</div>
        <div v-else class="airport-list">
          <article v-for="airport in state.airports" :key="airport.id" class="airport-item">
            <div>
              <strong>{{ airport.name }}</strong>
              <span>{{ airport.runwayCount }}활주로 · {{ airport.standCount }}스탠드</span>
            </div>
            <b>관제 준비</b>
          </article>
        </div>
      </section>

      <p v-if="message" class="message">{{ message }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { rctsLiteManager } from '../stores/rctsLiteManager'
import { formatDuration, formatMoney } from '../modules/time'

const state = rctsLiteManager.state
const draftNames = reactive({})
const message = ref('')

const airportProjects = computed(() => rctsLiteManager.getters.airportProjects.value)

const flash = (text) => {
  message.value = text
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 2400)
}

const buildAirport = (airportId) => {
  const result = rctsLiteManager.startAirportConstruction({ airportId, customName: draftNames[airportId] })
  flash(result.message)
  if (result.ok) draftNames[airportId] = ''
}

const progressPercent = (project) => {
  const total = Math.max(1, project.buildSeconds * 1000)
  const elapsed = Math.max(0, state.tickNow - project.startedAt)
  return Math.min(100, Math.floor((elapsed / total) * 100))
}
</script>

<style scoped>
.page-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); }
.page-head, .panel:not(.page-head):not(.airport-card) { padding: 22px; }
.page-head { display: flex; justify-content: space-between; gap: 14px; align-items: center; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h1, h2, p { margin: 0; letter-spacing: -0.03em; }
h1 { font-size: clamp(28px, 4vw, 42px); }
h2 { font-size: 20px; }
.money { color: #bfdbfe; font-weight: 900; }
.airport-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.airport-card { display: grid; gap: 14px; padding: 20px; }
.airport-card span, .airport-card p, label span, .project-top span, .airport-item span { color: #94a3b8; font-size: 13px; line-height: 1.5; }
.price-row { display: flex; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: rgba(30, 41, 59, 0.72); }
.price-row span { color: #94a3b8; }
.price-row b, .project-top b, .airport-item b { color: #bfdbfe; }
label { display: grid; gap: 7px; }
input { width: 100%; min-height: 44px; padding: 0 13px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 14px; color: #e5e7eb; background: rgba(2, 6, 23, 0.4); outline: none; }
button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 14px; color: white; font-weight: 900; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
button:disabled { cursor: not-allowed; opacity: 0.45; }
.section-title { margin-bottom: 14px; }
.empty { padding: 24px; color: #94a3b8; text-align: center; }
.empty.inner { border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; }
.project-list, .airport-list { display: grid; gap: 10px; }
.project-card, .airport-item { display: grid; gap: 12px; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.project-top, .airport-item { display: flex; justify-content: space-between; gap: 14px; align-items: center; }
.project-top > div, .airport-item > div { display: grid; gap: 4px; }
.progress-bar { height: 9px; overflow: hidden; border-radius: 999px; background: rgba(15, 23, 42, 0.9); }
.progress-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #38bdf8, #22c55e); }
.message { position: fixed; left: 50%; bottom: 92px; z-index: 30; transform: translateX(-50%); padding: 12px 16px; border-radius: 999px; color: #e0f2fe; background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(96, 165, 250, 0.28); }
@media (max-width: 900px) { .airport-grid { grid-template-columns: 1fr; } .page-head, .project-top, .airport-item { flex-direction: column; align-items: stretch; } }
</style>
