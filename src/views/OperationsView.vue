<template>
  <section class="page-stack">
    <div class="page-head panel">
      <div>
        <p class="eyebrow">운영</p>
        <h1>버스 / 선박 운행</h1>
      </div>
    </div>

    <div v-if="!state.companyCreated" class="panel empty">본부에서 회사를 먼저 생성하세요.</div>

    <template v-else>
      <section class="panel operation-start">
        <div class="section-title">
          <div>
            <p class="eyebrow">운행 시작</p>
            <h2>대기 차량 선택</h2>
          </div>
        </div>

        <div v-if="availableVehicles.length === 0" class="empty inner">대기 중인 차량/선박이 없습니다.</div>
        <div v-else class="vehicle-start-list">
          <article v-for="vehicle in availableVehicles" :key="vehicle.id" class="start-item">
            <div class="start-info">
              <strong>{{ vehicle.name }}</strong>
              <span>{{ vehicle.categoryLabel }} · {{ vehicle.capacity }}명</span>
            </div>

            <select v-model="selectedTemplates[vehicle.id]">
              <option value="">운행 선택</option>
              <option v-for="template in templatesFor(vehicle)" :key="template.id" :value="template.id">
                {{ template.title }} · {{ formatDuration(template.durationSeconds) }} · {{ formatMoney(template.fare) }}
              </option>
            </select>

            <button type="button" @click="start(vehicle.id)">운행개시</button>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">진행 중</p>
            <h2>곧 완료될 운행 순서</h2>
          </div>
        </div>

        <div v-if="runningOperations.length === 0" class="empty inner">진행 중인 운행이 없습니다.</div>
        <div v-else class="running-list">
          <article v-for="operation in runningOperations" :key="operation.id" class="run-card">
            <div class="run-top">
              <div>
                <strong>{{ operation.title }}</strong>
                <span>{{ operation.vehicleName }}</span>
              </div>
              <b>{{ formatDuration((operation.endsAt - state.tickNow) / 1000) }}</b>
            </div>
            <div class="progress-bar">
              <i :style="{ width: `${progressPercent(operation)}%` }"></i>
            </div>
            <div class="run-meta">
              <span>{{ operation.passengers }}명 탑승</span>
              <span>예상 정산 {{ formatMoney(operation.revenue) }}</span>
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
const selectedTemplates = reactive({})
const message = ref('')

const availableVehicles = computed(() => {
  return state.ownedVehicles.filter((vehicle) => {
    return ['bus', 'ship'].includes(vehicle.type) && rctsLiteManager.getVehicleStatus(vehicle.id) === '대기'
  })
})

const runningOperations = computed(() => rctsLiteManager.getters.runningOperations.value)

const templatesFor = (vehicle) => {
  return rctsLiteManager.operationTemplates.filter((template) => rctsLiteManager.isTemplateAllowedForVehicle(template, vehicle))
}

const flash = (text) => {
  message.value = text
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 2400)
}

const start = (vehicleId) => {
  const templateId = selectedTemplates[vehicleId]
  if (!templateId) {
    flash('운행을 선택하세요.')
    return
  }
  const result = rctsLiteManager.startOperation({ vehicleId, templateId })
  flash(result.message)
  if (result.ok) selectedTemplates[vehicleId] = ''
}

const progressPercent = (operation) => {
  const total = Math.max(1, operation.durationSeconds * 1000)
  const elapsed = Math.max(0, state.tickNow - operation.startedAt)
  return Math.min(100, Math.floor((elapsed / total) * 100))
}
</script>

<style scoped>
.page-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); }
.page-head, .operation-start, .panel:not(.page-head):not(.operation-start) { padding: 22px; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h1, h2 { margin: 0; letter-spacing: -0.03em; }
h1 { font-size: clamp(28px, 4vw, 42px); }
h2 { font-size: 20px; }
.section-title { margin-bottom: 14px; }
.empty { padding: 24px; color: #94a3b8; text-align: center; }
.empty.inner { border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; }
.vehicle-start-list, .running-list { display: grid; gap: 12px; }
.start-item { display: grid; grid-template-columns: 1fr minmax(220px, 300px) auto; gap: 10px; align-items: center; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.start-info { display: grid; gap: 4px; }
.start-info span, .run-top span, .run-meta span { color: #94a3b8; font-size: 13px; }
select { min-height: 44px; padding: 0 12px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 14px; color: #e5e7eb; outline: none; background: rgba(2, 6, 23, 0.45); }
button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 14px; color: white; font-weight: 900; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
.run-card { display: grid; gap: 12px; padding: 16px; border-radius: 18px; background: rgba(30, 41, 59, 0.64); }
.run-top { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.run-top > div { display: grid; gap: 4px; }
.run-top b { color: #bfdbfe; white-space: nowrap; }
.progress-bar { height: 10px; overflow: hidden; border-radius: 999px; background: rgba(2, 6, 23, 0.65); }
.progress-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2563eb, #22d3ee); }
.run-meta { display: flex; justify-content: space-between; gap: 10px; }
.message { position: fixed; left: 50%; bottom: 92px; z-index: 30; transform: translateX(-50%); padding: 12px 16px; border-radius: 999px; color: #e0f2fe; background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(96, 165, 250, 0.28); }
@media (max-width: 760px) { .start-item { grid-template-columns: 1fr; } .run-top, .run-meta { flex-direction: column; } button, select { width: 100%; } }
</style>
