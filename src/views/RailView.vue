<template>
  <section class="page-stack">
    <div class="page-head panel">
      <div>
        <p class="eyebrow">철도</p>
        <h1>노선 만들기 / 차량 운행</h1>
      </div>
    </div>

    <div v-if="!state.companyCreated" class="panel empty">본부에서 회사를 먼저 생성하세요.</div>

    <template v-else>
      <section class="panel route-form">
        <div class="section-title">
          <div>
            <p class="eyebrow">노선</p>
            <h2>철도 노선 만들기</h2>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="createRoute">
          <label>
            <span>노선명</span>
            <input v-model="routeDraft.name" type="text" placeholder="예: 중앙선" />
          </label>

          <label>
            <span>거리(km)</span>
            <input v-model.number="routeDraft.distanceKm" type="number" min="1" inputmode="decimal" />
          </label>

          <label>
            <span>역 수</span>
            <input v-model.number="routeDraft.stationCount" type="number" min="2" inputmode="numeric" />
          </label>

          <label>
            <span>평균속도(km/h)</span>
            <input v-model.number="routeDraft.averageSpeedKmh" type="number" min="20" inputmode="numeric" />
          </label>

          <label>
            <span>운임</span>
            <input v-model.number="routeDraft.fare" type="number" min="100" inputmode="numeric" />
          </label>

          <button type="submit">노선 생성</button>
        </form>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">운행</p>
            <h2>철도 차량 노선 투입</h2>
          </div>
        </div>

        <div v-if="railVehicles.length === 0" class="empty inner">보유 중인 철도 차량이 없습니다.</div>
        <div v-else-if="state.railRoutes.length === 0" class="empty inner">생성된 철도 노선이 없습니다.</div>
        <div v-else class="dispatch-list">
          <article v-for="vehicle in railVehicles" :key="vehicle.id" class="dispatch-card">
            <div>
              <strong>{{ vehicle.name }}</strong>
              <span>{{ vehicle.modelHint }} · {{ vehicle.capacity }}명 · {{ getVehicleStatus(vehicle.id) }}</span>
            </div>

            <select v-model="selectedRoutes[vehicle.id]" :disabled="getVehicleStatus(vehicle.id) !== '대기'">
              <option value="">노선 선택</option>
              <option v-for="route in state.railRoutes" :key="route.id" :value="route.id">
                {{ route.name }} · {{ route.distanceKm }}km · 약 {{ formatDuration(getRouteDuration(route)) }}
              </option>
            </select>

            <button type="button" :disabled="getVehicleStatus(vehicle.id) !== '대기'" @click="startRail(vehicle.id)">운행개시</button>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">목록</p>
            <h2>철도 노선 목록</h2>
          </div>
        </div>

        <div v-if="state.railRoutes.length === 0" class="empty inner">생성된 철도 노선이 없습니다.</div>
        <div v-else class="route-list">
          <article v-for="route in state.railRoutes" :key="route.id" class="route-item">
            <div>
              <strong>{{ route.name }}</strong>
              <span>{{ route.distanceKm }}km · {{ route.stationCount }}역 · 평균 {{ route.averageSpeedKmh }}km/h · 운임 {{ formatMoney(route.fare) }}</span>
            </div>
            <div class="route-side">
              <b>약 {{ formatDuration(getRouteDuration(route)) }}</b>
              <button type="button" @click="deleteRoute(route.id)">삭제</button>
            </div>
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
const message = ref('')
const selectedRoutes = reactive({})

const routeDraft = reactive({
  name: '',
  distanceKm: 12,
  stationCount: 5,
  averageSpeedKmh: 60,
  fare: 1800,
})

const railVehicles = computed(() => rctsLiteManager.getters.railVehicles.value)

const flash = (text) => {
  message.value = text
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 2400)
}

const createRoute = () => {
  const result = rctsLiteManager.createRailRoute(routeDraft)
  flash(result.message)
  if (result.ok) {
    routeDraft.name = ''
    routeDraft.distanceKm = 12
    routeDraft.stationCount = 5
    routeDraft.averageSpeedKmh = 60
    routeDraft.fare = 1800
  }
}

const deleteRoute = (routeId) => {
  const result = rctsLiteManager.deleteRailRoute(routeId)
  flash(result.message)
}

const startRail = (vehicleId) => {
  const routeId = selectedRoutes[vehicleId]
  if (!routeId) {
    flash('노선을 선택하세요.')
    return
  }
  const result = rctsLiteManager.startRailOperation({ vehicleId, routeId })
  flash(result.message)
  if (result.ok) selectedRoutes[vehicleId] = ''
}

const getRouteDuration = (route) => rctsLiteManager.calculateRailDurationSeconds(route)
const getVehicleStatus = (vehicleId) => rctsLiteManager.getVehicleStatus(vehicleId)
</script>

<style scoped>
.page-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); }
.page-head, .panel:not(.page-head) { padding: 22px; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h1, h2 { margin: 0; letter-spacing: -0.03em; }
h1 { font-size: clamp(28px, 4vw, 42px); }
h2 { font-size: 20px; }
.section-title { margin-bottom: 14px; }
.form-grid { display: grid; grid-template-columns: repeat(5, 1fr) auto; gap: 10px; align-items: end; }
label { display: grid; gap: 7px; }
label span, .dispatch-card span, .route-item span { color: #94a3b8; font-size: 13px; }
input, select { width: 100%; min-height: 44px; padding: 0 12px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 14px; color: #e5e7eb; outline: none; background: rgba(2, 6, 23, 0.45); }
button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 14px; color: white; font-weight: 900; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
button:disabled { cursor: not-allowed; opacity: 0.45; }
.empty { padding: 24px; color: #94a3b8; text-align: center; }
.empty.inner { border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; }
.dispatch-list, .route-list { display: grid; gap: 10px; }
.dispatch-card { display: grid; grid-template-columns: 1fr minmax(240px, 360px) auto; gap: 10px; align-items: center; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.dispatch-card > div, .route-item > div:first-child { display: grid; gap: 4px; }
.route-item { display: flex; justify-content: space-between; gap: 14px; align-items: center; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.route-side { display: flex; align-items: center; gap: 10px; }
.route-side b { color: #bfdbfe; white-space: nowrap; }
.route-side button { min-height: 38px; color: #fecaca; border: 1px solid rgba(248, 113, 113, 0.24); background: rgba(239, 68, 68, 0.18); }
.message { position: fixed; left: 50%; bottom: 92px; z-index: 30; transform: translateX(-50%); padding: 12px 16px; border-radius: 999px; color: #e0f2fe; background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(96, 165, 250, 0.28); }
@media (max-width: 900px) { .form-grid, .dispatch-card { grid-template-columns: 1fr; } .route-item, .route-side { flex-direction: column; align-items: stretch; } button { width: 100%; } }
</style>
