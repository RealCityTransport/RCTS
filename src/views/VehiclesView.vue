<template>
  <section class="page-stack">
    <div class="page-head panel">
      <div>
        <p class="eyebrow">차량</p>
        <h1>버스 / 선박 / 철도 구입</h1>
      </div>
      <div class="money">{{ formatMoney(state.money) }}</div>
    </div>

    <div v-if="!state.companyCreated" class="panel empty">본부에서 회사를 먼저 생성하세요.</div>

    <template v-else>
      <div class="tab-row">
        <button :class="{ active: activeTab === 'bus' }" type="button" @click="activeTab = 'bus'">버스</button>
        <button :class="{ active: activeTab === 'ship' }" type="button" @click="activeTab = 'ship'">선박</button>
        <button :class="{ active: activeTab === 'rail' }" type="button" @click="activeTab = 'rail'">철도</button>
        <button :class="{ active: activeTab === 'owned' }" type="button" @click="activeTab = 'owned'">보유 목록</button>
      </div>

      <section v-if="activeTab !== 'owned'" class="catalog-grid">
        <article v-for="item in activeCatalog" :key="item.id" class="vehicle-card panel">
          <div class="vehicle-top">
            <div>
              <p class="type">{{ item.categoryLabel }}</p>
              <h2>{{ item.name }}</h2>
              <span>{{ item.modelHint }}</span>
            </div>
            <strong>{{ item.capacity }}명</strong>
          </div>

          <p class="description">{{ item.description }}</p>

          <div class="price-row">
            <span>구입가</span>
            <b>{{ formatMoney(item.price) }}</b>
          </div>

          <label>
            <span>이름</span>
            <input v-model="draftNames[item.id]" type="text" :placeholder="`${item.name} 1`" />
          </label>

          <button type="button" :disabled="state.money < item.price" @click="purchase(item.id)">
            구입
          </button>
        </article>
      </section>

      <section v-else class="owned-list panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">보유</p>
            <h2>보유 차량 / 선박</h2>
          </div>
        </div>

        <div v-if="state.ownedVehicles.length === 0" class="empty inner">보유 중인 차량이나 선박이 없습니다.</div>
        <div v-else class="list">
          <article v-for="vehicle in state.ownedVehicles" :key="vehicle.id" class="owned-item">
            <div>
              <strong>{{ vehicle.name }}</strong>
              <span>{{ vehicle.categoryLabel }} · {{ vehicle.modelHint }} · {{ vehicle.capacity }}명</span>
            </div>
            <div class="owned-side">
              <b>{{ getVehicleStatus(vehicle.id) }}</b>
              <button type="button" :disabled="getVehicleStatus(vehicle.id) !== '대기'" @click="sell(vehicle.id)">50% 매각</button>
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
import { formatMoney } from '../modules/time'

const state = rctsLiteManager.state
const activeTab = ref('bus')
const draftNames = reactive({})
const message = ref('')

const activeCatalog = computed(() => {
  if (activeTab.value === 'bus') return rctsLiteManager.getters.busCatalog.value
  if (activeTab.value === 'ship') return rctsLiteManager.getters.shipCatalog.value
  return rctsLiteManager.getters.railCatalog.value
})

const flash = (text) => {
  message.value = text
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 2400)
}

const purchase = (catalogId) => {
  const result = rctsLiteManager.purchaseVehicle({ catalogId, customName: draftNames[catalogId] })
  flash(result.message)
  if (result.ok) draftNames[catalogId] = ''
}

const sell = (vehicleId) => {
  const result = rctsLiteManager.sellVehicle(vehicleId)
  flash(result.message)
}

const getVehicleStatus = (vehicleId) => rctsLiteManager.getVehicleStatus(vehicleId)
</script>

<style scoped>
.page-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); }
.page-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 24px; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h1, h2, p { margin: 0; }
h1 { font-size: clamp(28px, 4vw, 42px); letter-spacing: -0.03em; }
h2 { font-size: 20px; }
.money { color: #bfdbfe; font-weight: 900; }
.tab-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.tab-row::-webkit-scrollbar { display: none; }
.tab-row button { min-height: 44px; padding: 0 18px; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 14px; color: #94a3b8; font-weight: 900; cursor: pointer; background: rgba(15, 23, 42, 0.72); white-space: nowrap; }
.tab-row button.active { color: #e0f2fe; border-color: rgba(96, 165, 250, 0.6); background: rgba(37, 99, 235, 0.24); }
.catalog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.vehicle-card { display: grid; gap: 16px; padding: 20px; }
.vehicle-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.vehicle-top span, .description, label span, .owned-item span { color: #94a3b8; font-size: 13px; line-height: 1.5; }
.type { color: #38bdf8; font-size: 12px; font-weight: 900; }
.vehicle-top strong { color: #bbf7d0; }
.price-row { display: flex; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: rgba(30, 41, 59, 0.72); }
.price-row span { color: #94a3b8; }
.price-row b { color: #bfdbfe; }
label { display: grid; gap: 7px; }
input { width: 100%; min-height: 44px; padding: 0 13px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 14px; color: #e5e7eb; background: rgba(2, 6, 23, 0.4); outline: none; }
button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 14px; color: white; font-weight: 900; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
button:disabled { cursor: not-allowed; opacity: 0.45; }
.owned-list { padding: 22px; }
.section-title { margin-bottom: 14px; }
.list { display: grid; gap: 10px; }
.owned-item { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.owned-item > div:first-child { display: grid; gap: 4px; }
.owned-side { display: flex; gap: 10px; align-items: center; }
.owned-side b { color: #bfdbfe; white-space: nowrap; }
.owned-side button { min-height: 38px; background: rgba(239, 68, 68, 0.18); color: #fecaca; border: 1px solid rgba(248, 113, 113, 0.24); }
.empty { padding: 24px; color: #94a3b8; text-align: center; }
.empty.inner { border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; }
.message { position: fixed; left: 50%; bottom: 92px; z-index: 30; transform: translateX(-50%); padding: 12px 16px; border-radius: 999px; color: #e0f2fe; background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(96, 165, 250, 0.28); }
@media (max-width: 760px) { .page-head, .owned-item, .owned-side { align-items: stretch; flex-direction: column; } .catalog-grid { grid-template-columns: 1fr; } .owned-side button { width: 100%; } }
</style>
