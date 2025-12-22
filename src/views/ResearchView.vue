<!-- src/views/ResearchView.vue -->
<template>
  <div class="research-page">
    <header class="research-header">
      <h1 class="title">연구실</h1>
      <p class="desc">
        연구는 한 번에 1개만 진행됩니다. 진행 중일 때는 다음 연구를 예약할 수 있어요.
      </p>

      <div class="status-row">
        <span class="badge" :class="{ ok: isHydrated }">
          {{ isHydrated ? '상태 준비 완료' : '상태 불러오는 중…' }}
        </span>
        <span class="badge" :class="{ warn: needsFirstUnlockSelection }">
          {{ needsFirstUnlockSelection ? '최초 해금 필요(즉시)' : '최초 해금 완료' }}
        </span>
        <span v-if="firstUnlockTransportId" class="badge ok">
          최초 해금: {{ transportLabel(firstUnlockTransportId) }}
        </span>
        <span class="badge">
          예약: {{ queueCount }}/{{ queueLimit }} (Lv{{ queueReserveLevel }})
        </span>
      </div>
    </header>

    <!-- 1) 연구 진행 -->
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">연구 진행</h2>
        <div class="panel-actions">
          <button class="btn" :disabled="!canManualSave" @click="saveNow({ reason: 'manual' })">
            수동 저장
          </button>
          <button class="btn ghost" @click="debugDump">
            디버그 출력
          </button>
        </div>
      </div>

      <div v-if="!isHydrated" class="empty">불러오는 중…</div>

      <div v-else-if="!activeResearch" class="empty">
        진행 중인 연구가 없습니다. 아래 목록에서 시작할 항목을 선택하세요.
      </div>

      <div v-else class="list">
        <article class="card">
          <div class="card-left">
            <div class="icon">🔬</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">{{ titleOf(activeResearch.id) }}</div>
              <div class="meta">
                <span class="pill">진행중</span>
                <span class="pill time">{{ durationLabelOf(activeResearch.id) }}</span>
                <span v-if="isFixedOf(activeResearch.id)" class="pill fixed">고정</span>
              </div>
            </div>

            <div v-if="isFixedOf(activeResearch.id)" class="hint2">
              이 연구는 고정 시간이며, 연구 효율의 영향을 받지 않습니다.
            </div>

            <div class="progress-area">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: researchProgress(activeResearch.id) + '%' }"></div>
              </div>
              <div class="progress-info">
                <span>{{ researchProgress(activeResearch.id).toFixed(1) }}%</span>
                <span class="mono">남은시간: {{ researchRemaining(activeResearch.id) }}</span>
              </div>
            </div>

            <div v-if="queuedResearchIds.length > 0" class="queue-row">
              <span class="pill">예약됨</span>
              <span class="queue-title">
                {{ queuedResearchIds.length }}개
              </span>
              <button class="btn small ghost" @click="cancelAllQueue">전체 취소</button>
            </div>

            <div v-if="queuedResearchIds.length > 0" class="queue-list">
              <div v-for="qid in queuedResearchIds" :key="qid" class="queue-item">
                <span class="mono">{{ titleOf(qid) }}</span>
                <button class="btn small ghost" @click="cancelQueue(qid)">취소</button>
              </div>
            </div>
          </div>

          <div class="card-right">
            <button class="btn primary" disabled>진행중</button>
          </div>
        </article>
      </div>
    </section>

    <!-- 2) 연구 가능(예약 가능) -->
    <section class="panel">
      <h2 class="panel-title">연구 가능(예약 가능)</h2>
      <p class="panel-desc">
        아래 항목은 지금 바로 시작하거나(진행 중이면 예약) 할 수 있습니다. 최초 해금이 필요한 경우 “즉시 해금”으로 표시됩니다.
      </p>

      <div v-if="!isHydrated" class="empty">불러오는 중…</div>
      <div v-else-if="availableSorted.length === 0 && firstUnlockList.length === 0" class="empty">
        현재 시작 가능한 연구가 없습니다.
      </div>

      <div v-else class="list">
        <!-- ✅ 최초 해금(즉시)도 같은 리스트 흐름으로 -->
        <article v-for="r in firstUnlockList" :key="r.key" class="card">
          <div class="card-left">
            <div class="icon">{{ r.icon }}</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">{{ r.title }}</div>
              <div class="meta">
                <span class="pill time">즉시</span>
                <span class="pill" v-if="needsFirstUnlockSelection">필수</span>
              </div>
            </div>
            <div class="hint2" v-if="r.desc">{{ r.desc }}</div>
          </div>

          <div class="card-right">
            <button
              class="btn primary"
              :disabled="!!activeResearch || !isHydrated"
              @click="pickFirstUnlock(r.transportId)"
            >
              즉시 해금
            </button>
          </div>
        </article>

        <!-- ✅ 일반 연구(available) -->
        <article v-for="r in availableSorted" :key="r.id" class="card">
          <div class="card-left">
            <div class="icon">{{ iconOf(r) }}</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">{{ r.title }}</div>
              <div class="meta">
                <span class="pill time">{{ r.durationLabel }}</span>
                <span v-if="r.fixed" class="pill fixed">고정</span>
                <span class="pill" v-if="activeResearch">대기</span>
                <span class="pill" v-else>가능</span>
              </div>
            </div>

            <div class="hint2" v-if="r.desc">{{ r.desc }}</div>
            <div class="hint2" v-if="r.fixed">연구 효율 미적용 · 완료 시 시스템이 즉시 개방됩니다.</div>
          </div>

          <div class="card-right">
            <button
              class="btn primary"
              :disabled="!isHydrated || (activeResearch && isQueueFull && !isQueued(r.id))"
              @click="startOrQueue(r.id)"
            >
              {{ buttonLabel(r.id) }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- 3) 잠김 연구 리스트 -->
    <section class="panel">
      <h2 class="panel-title">잠김 연구 리스트</h2>
      <p class="panel-desc">
        아직 시작할 수 없는 연구입니다. 선행 연구 완료 또는 업데이트 반영 시 해금됩니다.
      </p>

      <div v-if="!isHydrated" class="empty">불러오는 중…</div>
      <div v-else-if="lockedSorted.length === 0" class="empty">잠김/개발중 항목이 없습니다.</div>

      <div v-else class="list">
        <article v-for="r in lockedSorted" :key="r.id" class="card">
          <div class="card-left">
            <div class="icon">🔒</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">{{ r.title }}</div>
              <div class="meta">
                <span class="pill lock">{{ r.statusLabel }}</span>
                <span class="pill time">{{ r.durationLabel }}</span>
                <span v-if="r.fixed" class="pill fixed">고정</span>
              </div>
            </div>

            <div class="hint2" v-if="r.desc">{{ r.desc }}</div>
            <div class="hint2" v-if="r.status === 'comingSoon'">개발중입니다.</div>
            <div class="hint2" v-else-if="r.status === 'locked'">{{ r.lockReason || '선행 연구가 필요합니다.' }}</div>
          </div>

          <div class="card-right">
            <button class="btn primary" disabled>잠김</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useResearch } from '@/composables/useResearch';
import { transportMeta } from '@/data/transports/meta';

const research = useResearch();

const isHydrated = computed(() => research.isHydrated.value);

const firstUnlockTransportId = research.firstUnlockTransportId;
const needsFirstUnlockSelection = research.needsFirstUnlockSelection;
const firstUnlockCandidates = research.firstUnlockCandidates;

const activeResearch = computed(() => research.activeResearch.value);

const queuedResearchIds = computed(() => research.queuedResearchIds.value || []);
const queueReserveLevel = computed(() => research.queueReserveLevel.value || 1);
const queueLimit = computed(() => research.queueLimit.value || 1);
const queueCount = computed(() => research.queueCount.value || 0);
const isQueueFull = computed(() => research.isQueueFull.value);

const canManualSave = computed(() => {
  return !!research.saveEnabled.value && !!research.isStateLoaded.value && !research.isSavingFirebaseData.value;
});

function transportLabel(id) {
  return transportMeta[id]?.name ?? id;
}

function defOf(researchId) {
  return research.catalog.find(x => x.id === researchId) || null;
}

function titleOf(researchId) {
  const def = defOf(researchId);
  return def?.title ?? researchId;
}

function isFixedDef(def) {
  if (!def) return false;
  if (def.timePolicy === 'FIXED') return true;
  return def.type === 'SYSTEM';
}

function isFixedOf(researchId) {
  return isFixedDef(defOf(researchId));
}

/**
 * ✅ 데이터 연동 표기(정확한 시간 표기)
 */
function formatDurationHuman(sec) {
  const s = Math.max(0, Number(sec || 0));
  if (!s) return '즉시';

  if (s < 3600) {
    const mins = Math.max(1, Math.round(s / 60));
    return `${mins}분`;
  }

  const hours = Math.floor(s / 3600);
  const mins = Math.round((s % 3600) / 60);

  if (mins > 0) return `${hours}시간 ${mins}분`;
  return `${hours}시간`;
}

function durationLabel(def) {
  const sec = Number(def?.durationSec || 0);
  const fixed = isFixedDef(def);

  const human = formatDurationHuman(sec);
  if (human === '즉시') return '즉시';

  return fixed ? `고정: ${human}` : `연구: ${human}`;
}

function durationLabelOf(researchId) {
  return durationLabel(defOf(researchId));
}

// ---- 최초 해금(즉시) 리스트 ----
function findTier1TransportId(def) {
  const eff = (def.effects || []).find(e => e?.type === 'UNLOCK_TRANSPORT_TIER' && Number(e?.tier || 1) === 1);
  return eff?.transportId || null;
}

function toFirstUnlockItem(def, candidatesSet) {
  const tid = findTier1TransportId(def);
  if (!tid) return null;
  if (!candidatesSet.has(tid)) return null;

  return {
    key: `first-${tid}`,
    transportId: tid,
    icon: transportMeta[tid]?.icon ?? '⭐',
    title: `${transportMeta[tid]?.name ?? tid} 즉시 해금`,
    desc: '최초 1개는 즉시 해금됩니다.',
  };
}

const firstUnlockList = computed(() => {
  const list = research.visibleCatalog.value || [];
  if (!!firstUnlockTransportId.value) return [];

  const candidatesSet = new Set((firstUnlockCandidates.value || []).map(x => x.id));
  return list.map(def => toFirstUnlockItem(def, candidatesSet)).filter(Boolean);
});

// ---- 핵심: available / locked 를 "한 리스트"로 정리 + 가나다 정렬 ----
function koSortByTitle(a, b) {
  const ta = String(a?.title ?? '').trim();
  const tb = String(b?.title ?? '').trim();
  return ta.localeCompare(tb, 'ko');
}

function toUiItem(def) {
  return {
    id: def.id,
    title: def.title ?? def.id,
    desc: def.desc ?? '',
    durationLabel: durationLabel(def),
    fixed: isFixedDef(def),
    type: def.type,
    domain: def.domain,
  };
}

const availableSorted = computed(() => {
  const list = (research.visibleCatalog.value || [])
    .filter(def => research.getStatus(def.id) === 'available')
    .map(toUiItem)
    .sort(koSortByTitle);

  return list;
});

const lockedSorted = computed(() => {
  const list = (research.visibleCatalog.value || [])
    .map(def => {
      const st = research.getStatus(def.id);
      if (st !== 'locked' && st !== 'comingSoon') return null;
      return {
        ...toUiItem(def),
        status: st,
        statusLabel: st === 'comingSoon' ? '개발중' : '잠김',
        lockReason: '선행 연구가 필요합니다.',
      };
    })
    .filter(Boolean)
    .sort(koSortByTitle);

  return list;
});

// ---- 아이콘 매핑(가독성용) ----
function iconOf(r) {
  const t = String(r?.type || '');
  if (t === 'SYSTEM') return '🧩';
  if (t === 'CITY') return '🏙️';
  if (t === 'TRANSPORT') return '🚚';
  if (t === 'EFFICIENCY') return '⚙️';
  if (String(r?.id || '').startsWith('sys_preview_')) return '🧪';
  return '🔬';
}

// ---- 버튼 라벨/상태 ----
function isQueued(id) {
  return queuedResearchIds.value.includes(id);
}
function buttonLabel(id) {
  if (!activeResearch.value) return '연구 시작';
  if (isQueued(id)) return '예약됨';
  if (isQueueFull.value) return '예약 가득';
  return '예약';
}

// ---- 액션 ----
function pickFirstUnlock(transportId) {
  research.setFirstUnlockTransport(transportId);
}
function startOrQueue(researchId) {
  research.startResearch(researchId);
}
function cancelQueue(researchId) {
  research.cancelQueuedResearch(researchId);
}
function cancelAllQueue() {
  research.cancelAllQueuedResearch();
}
function researchProgress(researchId) {
  return research.getResearchProgress(researchId);
}
function researchRemaining(researchId) {
  return research.getResearchRemainingTime(researchId);
}
function saveNow(payload) {
  research.saveNow(payload);
}

function debugDump() {
  console.log('[ResearchView Debug]');
  console.log('queueReserveLevel:', queueReserveLevel.value);
  console.log('queueLimit:', queueLimit.value);
  console.log('queuedResearchIds:', queuedResearchIds.value);

  const pv = (research.visibleCatalog.value || []).filter(d => String(d?.id || '').startsWith('sys_preview_'));
  console.log('[Preview durations]', pv.map(d => ({ id: d.id, sec: d.durationSec, label: durationLabel(d) })));
}
</script>

<style scoped>
/* 기존 스타일 그대로 유지 */
.research-page {
  width: 100%;
  height: 100%;
  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  padding: 18px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  gap: 14px;

  -ms-overflow-style: none;
  scrollbar-width: none;
}
.research-page::-webkit-scrollbar { width: 0; height: 0; }

.research-header {
  padding: 14px 14px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
}

.title { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
.desc  { margin: 0 0 10px 0; opacity: 0.85; font-size: 13px; line-height: 1.35; }

.status-row { display: flex; flex-wrap: wrap; gap: 8px; }

.badge {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  opacity: 0.95;
}
.badge.ok   { border-color: rgba(120, 255, 120, 0.25); }
.badge.warn { border-color: rgba(255, 190, 80, 0.25); }

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

.panel-title { margin: 0; font-size: 16px; font-weight: 800; }
.panel-desc  { margin: 8px 0 0 0; opacity: 0.85; font-size: 13px; line-height: 1.35; }

.panel-actions { display: flex; gap: 8px; }

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
.name { font-weight: 900; }

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
.pill.lock { opacity: 0.75; }
.pill.time { opacity: 0.75; }
.pill.fixed {
  border-color: rgba(255, 190, 80, 0.25);
  background: rgba(255, 190, 80, 0.10);
}

.progress-area { margin-top: 10px; }
.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
}
.progress-fill { height: 100%; background: rgba(120, 255, 120, 0.35); width: 0%; transition: width 0.25s ease; }
.progress-info {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  opacity: 0.9;
}

.queue-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.queue-title { font-size: 12px; opacity: 0.9; }

.queue-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
}

.hint2 { margin-top: 6px; opacity: 0.85; font-size: 12px; line-height: 1.35; }

.btn {
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: inherit;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
}
.btn.small { padding: 6px 8px; border-radius: 8px; font-size: 11px; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.ghost { opacity: 0.9; }
.btn.primary {
  width: 100%;
  border-color: rgba(120, 255, 120, 0.25);
  background: rgba(120, 255, 120, 0.12);
  font-weight: 800;
}

.empty {
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.18);
  opacity: 0.85;
  font-size: 13px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

@media (max-width: 900px) {
  .research-page {
    padding: 14px;
    gap: 12px;
  }

  .status-row { gap: 6px; }

  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }
  .panel-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .panel-actions .btn {
    flex: 1;
  }

  .card {
    grid-template-columns: 44px 1fr;
    align-items: start;
  }
  .card-right {
    grid-column: 1 / -1;
  }
  .card-right .btn {
    width: 100%;
  }

  .name-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .meta {
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .research-page { padding: 12px; }
  .panel { padding: 12px; }

  .title { font-size: 18px; }
  .panel-title { font-size: 15px; }

  .badge { font-size: 11px; padding: 5px 8px; }
}
</style>
