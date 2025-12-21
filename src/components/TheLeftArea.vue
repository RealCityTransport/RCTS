<!-- src/components/console/LeftArea.vue -->
<template>
  <aside class="layout-area left-area">
    <div class="left-panel-wrapper">
      <!-- 1) 운송 수단 목록 -->
      <section class="panel transport-list-container">
        <div class="panel-head">
          <h3 class="panel-heading">🚚 운송 수단</h3>
          <span class="panel-meta">{{ unlockedTransports.length }}종</span>
        </div>

        <ul class="transport-list" v-if="unlockedTransports.length > 0">
          <li
            v-for="transport in unlockedTransports"
            :key="transport.id"
            class="transport-item"
            :class="{ active: selectedTransportId === transport.id }"
            @click="setSelectedTransportId(transport.id)"
          >
            <span class="transport-icon">{{ transport.icon }}</span>
            <span class="transport-name">{{ transport.name }}</span>
            <span class="transport-count">0대</span>
          </li>
        </ul>

        <div v-else class="placeholder-box">
          <p class="placeholder-text">
            아직 해금된 운송 수단이 없습니다. 연구실에서 해금해 주세요.
          </p>
        </div>
      </section>

      <!-- 2) 선택 운송 수단 상세 -->
      <section class="panel transport-details-container">
        <div class="panel-head">
          <h3 class="panel-heading">
            {{ selectedTransport ? `${selectedTransport.name} 상세` : '운송 수단 상세' }}
          </h3>
          <span class="panel-meta" v-if="selectedTransport">ID: {{ selectedTransport.id }}</span>
        </div>

        <!-- 선택 안 했을 때 -->
        <div v-if="!selectedTransport" class="placeholder-box">
          <p class="placeholder-text">운송 수단을 선택하여 상세 정보를 확인하세요.</p>
        </div>

        <!-- 선택 했을 때 -->
        <div v-else class="details-content">
          <!-- 기본 정보 -->
          <div class="kv">
            <div class="kv-row">
              <span class="k">아이콘</span>
              <span class="v">{{ selectedTransport.icon }}</span>
            </div>
            <div class="kv-row">
              <span class="k">종류</span>
              <span class="v">{{ selectedTransport.name }}</span>
            </div>
            <div class="kv-row">
              <span class="k">총 보유</span>
              <span class="v">0대</span>
            </div>
            <div class="kv-row">
              <span class="k">연구 완료</span>
              <span class="v">{{ selectedTransport.locked ? '아니오' : '예' }}</span>
            </div>
          </div>

          <hr class="divider" />

          <!-- ✅ 프리뷰 잠금/오픈: "연구 완료"로만 결정 -->
          <div v-if="!previewStarterFleetUnlocked" class="lock-box">
            <p class="box-title">🔒 프리뷰 차량 활성화 잠김</p>
            <p class="box-desc">
              연구실에서 <strong>프리뷰 차량 활성화</strong> 연구를 완료하면,
              이곳에 <strong>프리뷰 차량/운행 상태</strong>가 표시됩니다.
            </p>
            <p class="box-desc subtle">
              (테스트도 연구 완료 후에만 활성화됩니다.)
            </p>

            <div v-if="!hasAnyStarterTransportUnlocked" class="preview-placeholder">
              <p class="placeholder-text">
                참고: 버스/트럭/철도 중 하나라도 해금하면 프리뷰 연구를 진행할 수 있어요.
              </p>
            </div>
          </div>

          <div v-else class="preview-box">
            <p class="box-title">✅ 프리뷰 차량 활성화</p>

            <!-- 재정이 아직 잠김이면: 무상지급/프리뷰만 -->
            <p class="box-desc" v-if="!financeUnlocked">
              재정이 잠겨있어서 <strong>프리뷰(무상 지급)</strong>만 동작합니다.
              (구매/비용은 재정 오픈 이후 연결)
            </p>
            <p class="box-desc" v-else>
              재정이 활성화되어 구매/비용 연동도 가능합니다. (연동 단계는 추후)
            </p>

            <div class="preview-placeholder">
              <p class="placeholder-text">
                프리뷰 운행 데이터 영역 (연동/표시 단계는 다음 작업에서 다듬기)
              </p>
            </div>
          </div>

          <p class="details-footnote">
            선택된 {{ selectedTransport.name }}의 운영 통계 및 관리 옵션이 이곳에 표시됩니다.
          </p>
        </div>
      </section>

      <!-- 3) 보유 자원 -->
      <section class="panel resource-container">
        <div class="panel-head">
          <h3 class="panel-heading">📦 보유 자원</h3>
          <span class="panel-meta">{{ financeUnlocked ? '활성' : '잠김' }}</span>
        </div>

        <div class="placeholder-box" v-if="!financeUnlocked">
          <p class="placeholder-text">재정을 해금해주세요.</p>
        </div>

        <div v-else class="resource-content">
          <div class="kv">
            <div class="kv-row">
              <span class="k">현금</span>
              <span class="v">$10,000</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useTransportUnlocks } from '@/composables/useTransportUnlocks';
import { useVehicles } from '@/composables/useVehicles';
import { useResearch } from '@/composables/useResearch';

// ✅ 운송 목록/상태는 어댑터에서 가져온다
const {
  transportTypes,
  unlockedTransports: unlockedRef,
} = useTransportUnlocks();

const research = useResearch();

// ✅ 재정 해금 여부 (기존 유지)
const financeUnlocked = computed(() => {
  return !!research.completedIds.value?.has?.('sys_unlock_finance');
});

// ✅ 프리뷰 차량 활성화(연구 완료 여부) - 강제 오픈 제거, 연구로만!
const previewStarterFleetUnlocked = computed(() => {
  return !!research.completedIds.value?.has?.('sys_preview_starter_vehicles');
});

// “버스/트럭/철도 중 하나라도 해금” 안내용(OR)
const hasAnyStarterTransportUnlocked = computed(() => {
  const ids = new Set((unlockedRef.value || []).map(x => x.id));
  return ids.has('bus') || ids.has('truck') || ids.has('rail');
});

// useVehicles 유지
const { selectedTransportId, setSelectedTransportId } = useVehicles();

// 템플릿에서 편하게 쓰려고 배열로 한 번 보정
const unlockedTransports = computed(() => unlockedRef.value || []);

// 현재 선택된 운송 수단 상세 정보
const selectedTransport = computed(() => {
  if (!selectedTransportId.value) return null;
  return (transportTypes.value || []).find((t) => t.id === selectedTransportId.value) || null;
});
</script>

<style scoped>
/* =========================================================
   LEFT AREA – Desktop control panel
   ========================================================= */

/* wrapper */
.left-area {
  background: var(--area-bg-color-left);
  padding: 10px;
  box-sizing: border-box;
  align-items: stretch;
  justify-content: flex-start;
}

/* panel stack */
.left-panel-wrapper {
  height: 100%;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* panels */
.panel {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  border-radius: 12px;
  padding: 10px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* panel header */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 2px 8px 2px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 8px;
}

.panel-heading {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.02em;
  opacity: 0.95;
}

.panel-meta {
  font-size: 11px;
  opacity: 0.65;
  white-space: nowrap;
}

/* allocate heights (desktop) */
.transport-list-container { flex: 0 0 220px; }
.transport-details-container { flex: 1 1 auto; }
.resource-container { flex: 0 0 120px; }

/* scroll region helpers */
.transport-list,
.details-content {
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  -ms-overflow-style: none;
  scrollbar-width: none;
}
.transport-list::-webkit-scrollbar,
.details-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* transport list */
.transport-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transport-item {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  user-select: none;
  transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease;
}

.transport-item:hover {
  background: rgba(255,255,255,0.05);
  transform: translateY(-1px);
}

.transport-item.active {
  border-color: rgba(120, 255, 120, 0.22);
  background: rgba(120, 255, 120, 0.10);
}

.transport-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
}

.transport-name {
  font-weight: 800;
  font-size: 12px;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transport-count {
  font-size: 11px;
  opacity: 0.70;
  white-space: nowrap;
}

/* placeholders */
.placeholder-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.02);
}

.placeholder-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.85;
}

/* detail kv */
.kv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}
.k {
  font-size: 11px;
  opacity: 0.70;
}
.v {
  font-size: 12px;
  font-weight: 800;
  opacity: 0.95;
}

/* divider */
.divider {
  margin: 12px 0;
  border: 0;
  border-top: 1px solid rgba(255,255,255,0.10);
}

/* lock/preview boxes */
.lock-box,
.preview-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0, 0, 0, 0.18);
  margin-bottom: 10px;
}

.preview-box {
  border-color: rgba(120, 255, 120, 0.18);
  background: rgba(120, 255, 120, 0.06);
}

.box-title {
  margin: 0 0 6px 0;
  font-weight: 900;
  font-size: 12px;
  opacity: 0.95;
}

.box-desc {
  margin: 0 0 6px 0;
  font-size: 12px;
  opacity: 0.88;
  line-height: 1.35;
}
.box-desc.subtle { opacity: 0.70; }

.preview-placeholder {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.02);
}

.details-footnote {
  margin: 8px 0 0 0;
  font-size: 12px;
  opacity: 0.75;
  line-height: 1.35;
}

/* resource */
.resource-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* small screens (desktop narrow) */
@media (max-width: 1100px) {
  .transport-list-container { flex-basis: 200px; }
  .resource-container { flex-basis: 110px; }
}
</style>
