<template>
  <section class="page-stack">
    <div class="page-head panel">
      <div>
        <p class="eyebrow">정산</p>
        <h1>운행 수익 정산</h1>
      </div>
      <button type="button" :disabled="settlementQueue.length === 0" @click="settleAll">전체 정산</button>
    </div>

    <div v-if="!state.companyCreated" class="panel empty">본부에서 회사를 먼저 생성하세요.</div>

    <template v-else>
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">대기</p>
            <h2>정산 대기</h2>
          </div>
        </div>

        <div v-if="settlementQueue.length === 0" class="empty inner">정산할 운행이 없습니다.</div>
        <div v-else class="list">
          <article v-for="settlement in settlementQueue" :key="settlement.id" class="settlement-item">
            <div>
              <strong>{{ settlement.title }}</strong>
              <span>{{ settlement.vehicleName }} · {{ settlement.passengers }}명 · {{ settlement.categoryLabel }}</span>
            </div>
            <div class="side">
              <b>{{ formatMoney(settlement.revenue) }}</b>
              <button type="button" @click="settle(settlement.id)">정산</button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">최근</p>
            <h2>정산 기록</h2>
          </div>
        </div>

        <div v-if="state.settlementHistory.length === 0" class="empty inner">최근 정산 기록이 없습니다.</div>
        <div v-else class="list compact">
          <article v-for="item in state.settlementHistory" :key="item.id" class="history-item">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.vehicleName }} · {{ new Date(item.settledAt).toLocaleString('ko-KR') }}</span>
            </div>
            <b>{{ formatMoney(item.revenue) }}</b>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { rctsLiteManager } from '../stores/rctsLiteManager'
import { formatMoney } from '../modules/time'

const state = rctsLiteManager.state
const settlementQueue = computed(() => rctsLiteManager.getters.settlementQueue.value)

const settle = (id) => {
  rctsLiteManager.settle(id)
}

const settleAll = () => {
  rctsLiteManager.settleAll()
}
</script>

<style scoped>
.page-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; background: rgba(15, 23, 42, 0.78); }
.page-head, .panel:not(.page-head) { padding: 22px; }
.page-head { display: flex; justify-content: space-between; gap: 14px; align-items: center; }
.eyebrow { margin: 0 0 6px; color: #38bdf8; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h1, h2 { margin: 0; letter-spacing: -0.03em; }
h1 { font-size: clamp(28px, 4vw, 42px); }
h2 { font-size: 20px; }
button { min-height: 42px; padding: 0 16px; border: 0; border-radius: 14px; color: white; font-weight: 900; cursor: pointer; background: linear-gradient(135deg, #2563eb, #0891b2); }
button:disabled { cursor: not-allowed; opacity: 0.45; }
.section-title { margin-bottom: 14px; }
.empty { padding: 24px; color: #94a3b8; text-align: center; }
.empty.inner { border: 1px dashed rgba(148, 163, 184, 0.22); border-radius: 16px; }
.list { display: grid; gap: 10px; }
.settlement-item, .history-item { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; background: rgba(30, 41, 59, 0.64); }
.settlement-item > div:first-child, .history-item > div:first-child { display: grid; gap: 4px; }
span { color: #94a3b8; font-size: 13px; }
.side { display: flex; align-items: center; gap: 10px; }
b { color: #bfdbfe; white-space: nowrap; }
@media (max-width: 760px) { .page-head, .settlement-item, .history-item, .side { flex-direction: column; align-items: stretch; } button { width: 100%; } }
</style>
