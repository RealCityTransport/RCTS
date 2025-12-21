<!-- src/views/ResearchView.vue -->
<template>
  <div class="research-page">
    <header class="research-header">
      <h1 class="title">연구실</h1>
      <p class="desc">
        최초 1개 운송수단은 즉시 해금, 이후 해금은 연구로 진행됩니다.
      </p>

      <div class="status-row">
        <span class="badge" :class="{ ok: isHydrated }">
          {{ isHydrated ? '상태 준비 완료' : '상태 불러오는 중…' }}
        </span>
        <span class="badge" :class="{ warn: needsFirstUnlockSelection }">
          {{ needsFirstUnlockSelection ? '최초 해금 선택 필요' : '최초 해금 선택 완료' }}
        </span>
        <span v-if="firstUnlockId" class="badge ok">
          최초 해금: {{ labelOf(firstUnlockId) }}
        </span>
      </div>
    </header>

    <!-- 1) 최초 해금 택1 -->
    <section v-if="needsFirstUnlockSelection" class="panel">
      <h2 class="panel-title">첫 번째 운송수단 선택 (즉시 해금)</h2>
      <p class="panel-desc">
        아래 6종 중 1개를 선택하면 즉시 해금됩니다. 이후 연구는 모두 1시간 소요됩니다.
      </p>

      <div class="grid">
        <button
          v-for="t in firstUnlockCandidates"
          :key="t.id"
          class="choice-card"
          :disabled="!isHydrated"
          @click="onPickFirst(t.id)"
        >
          <div class="choice-icon">{{ t.icon }}</div>
          <div class="choice-name">{{ t.name }}</div>
          <div class="choice-sub">즉시 해금</div>
        </button>
      </div>

      <div class="hint">
        <span class="mono">주의:</span> 최초 해금을 선택하기 전에는 연구 시작이 비활성화됩니다.
      </div>
    </section>

    <!-- 2) 연구 목록 (lockedTransports만 렌더) -->
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">연구 가능한 목록</h2>
        <div class="panel-actions">
          <button class="btn" :disabled="!canManualSave" @click="saveNow({ reason: 'manual' })">
            수동 저장
          </button>
          <button class="btn ghost" @click="debugDump">
            디버그 출력
          </button>
        </div>
      </div>

      <p class="panel-desc">
        연구 완료되면 해당 항목은 자동으로 이 목록에서 사라지고(locked=false),
        해금된 운송수단은 사이드 운송목록에 나타납니다.
      </p>

      <div v-if="!isHydrated" class="empty">
        상태를 불러오는 중이라 연구 목록을 잠시 숨깁니다.
      </div>

      <div v-else-if="lockedTransports.length === 0" class="empty">
        현재 연구할 항목이 없습니다. (모두 해금되었거나, 최초 해금 선택만 남은 상태일 수 있어요.)
      </div>

      <div v-else class="list">
        <article
          v-for="t in lockedTransports"
          :key="t.id"
          class="card"
        >
          <div class="card-left">
            <div class="icon">{{ t.icon }}</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">{{ t.name }}</div>
              <div class="meta">
                <span class="pill" v-if="t.isResearching">진행중</span>
                <span class="pill lock" v-else>잠김</span>
                <span class="pill time">연구: 1시간</span>
              </div>
            </div>

            <div v-if="t.isResearching" class="progress-area">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressOf(t.id) + '%' }"></div>
              </div>
              <div class="progress-info">
                <span>{{ progressOf(t.id).toFixed(1) }}%</span>
                <span class="mono">남은시간: {{ remainingOf(t.id) }}</span>
              </div>
            </div>

            <div v-else class="hint2">
              연구 시작 시 1시간 후 자동 해금됩니다.
            </div>
          </div>

          <div class="card-right">
            <button
              class="btn primary"
              :disabled="!canStart(t)"
              @click="startResearch(t.id)"
            >
              {{ t.isResearching ? '진행중' : '연구 시작' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- 3) 해금 목록(확인용, 스타일은 나중) -->
    <section class="panel">
      <h2 class="panel-title">해금된 운송수단</h2>
      <p class="panel-desc">
        여기와 사이드바 운송목록이 함께 늘어나면 정상 흐름입니다.
      </p>

      <div v-if="!isHydrated" class="empty">불러오는 중…</div>
      <div v-else-if="unlockedTransports.length === 0" class="empty">아직 해금된 운송수단이 없습니다.</div>

      <div v-else class="chips">
        <span v-for="t in unlockedTransports" :key="t.id" class="chip">
          <span class="chip-ico">{{ t.icon }}</span>
          <span class="chip-name">{{ t.name }}</span>
        </span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useResearch } from '@/composables/useResearch';

const {
  // 택1
  firstUnlockId,
  needsFirstUnlockSelection,
  firstUnlockCandidates,
  setFirstUnlockTransport,

  // 상태/목록
  lockedTransports,
  unlockedTransports,
  isHydrated,

  // 액션/유틸
  unlockTransport,
  getResearchProgress,
  getResearchRemainingTime,

  // 저장
  saveNow,
  isStateLoaded,
  isSavingFirebaseData,
  saveEnabled,
} = useResearch();

const canManualSave = computed(() => {
  // 저장 로직은 useResearch 내부 가드가 최종 결정하지만,
  // 버튼 UX를 위해 최소 조건만 반영
  return !!saveEnabled.value && !!isStateLoaded.value && !isSavingFirebaseData.value;
});

function labelOf(id) {
  const found = firstUnlockCandidates.value.find(x => x.id === id);
  return found ? found.name : id;
}

function onPickFirst(id) {
  // 최초 택1 즉시 해금
  setFirstUnlockTransport(id);
}

function canStart(t) {
  // 택1 먼저, hydrate 먼저
  if (!isHydrated.value) return false;
  if (needsFirstUnlockSelection.value) return false;

  // 이미 진행중이거나 이미 해금이면 불가
  if (!t.locked) return false;
  if (t.isResearching) return false;

  return true;
}

function startResearch(id) {
  unlockTransport(id);
}

function progressOf(id) {
  return getResearchProgress(id);
}

function remainingOf(id) {
  return getResearchRemainingTime(id);
}

function debugDump() {
  // 오빠가 “지금 뭐가 막히는지” 바로 보게 하는 디버그
  // 콘솔 붙여넣기 없이, 버튼 클릭으로만 확인 가능
  console.log('[ResearchView Debug]');
  console.log('isHydrated:', isHydrated.value);
  console.log('needsFirstUnlockSelection:', needsFirstUnlockSelection.value);
  console.log('firstUnlockId:', firstUnlockId.value);
  console.log('locked:', lockedTransports.value.map(t => t.id));
  console.log('unlocked:', unlockedTransports.value.map(t => t.id));
}
</script>

<style scoped>
.research-page {
  width: 100%;
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.research-header {
  padding: 14px 14px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
}

.title {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
}

.desc {
  margin: 0 0 10px 0;
  opacity: 0.85;
  font-size: 13px;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  opacity: 0.95;
}

.badge.ok {
  border-color: rgba(120, 255, 120, 0.25);
}

.badge.warn {
  border-color: rgba(255, 190, 80, 0.25);
}

.panel {
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.panel-desc {
  margin: 8px 0 0 0;
  opacity: 0.85;
  font-size: 13px;
  line-height: 1.35;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.choice-card {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.22);
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.choice-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.choice-icon {
  font-size: 22px;
}

.choice-name {
  margin-top: 8px;
  font-weight: 700;
}

.choice-sub {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.hint, .hint2 {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.85;
}

.list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  display: grid;
  grid-template-columns: 44px 1fr 120px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
}

.icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  font-size: 22px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.name {
  font-weight: 800;
}

.meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pill {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
  opacity: 0.9;
}

.pill.lock {
  opacity: 0.75;
}

.pill.time {
  opacity: 0.75;
}

.progress-area {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
}

.progress-fill {
  height: 100%;
  background: rgba(120, 255, 120, 0.35);
  width: 0%;
  transition: width 0.25s ease;
}

.progress-info {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  opacity: 0.9;
}

.btn {
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: inherit;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.ghost {
  opacity: 0.9;
}

.btn.primary {
  width: 100%;
  border-color: rgba(120, 255, 120, 0.25);
  background: rgba(120, 255, 120, 0.12);
  font-weight: 700;
}

.empty {
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.18);
  opacity: 0.85;
  font-size: 13px;
}

.chips {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
  font-size: 12px;
}

.chip-ico {
  font-size: 14px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
