<!-- src/components/TheLeftArea.vue -->
<template>
  <div class="layout-area left-area">
    <div class="left-panel-wrapper">
      <!-- 1. 운송 수단 목록 -->
      <div class="transport-list-container">
        <h3 class="panel-heading">🚚 운송 수단 🚚</h3>

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

        <!-- 해금된 운송수단이 없을 때 -->
        <div v-else class="transport-details-placeholder">
          <p class="placeholder-text">아직 해금된 운송 수단이 없습니다. 연구실에서 해금해 주세요.</p>
        </div>
      </div>

      <!-- 2. 가운데 영역: 선택 운송 수단 / 프리뷰 잠금 처리 -->
      <div class="transport-details-container">
        <h3 class="panel-heading">
          {{ selectedTransport ? `${selectedTransport.name} 상세 정보` : '운송 수단 상세 정보' }}
        </h3>

        <!-- 선택 안 했을 때 -->
        <div v-if="!selectedTransport" class="transport-details-placeholder">
          <p class="placeholder-text">운송 수단을 선택하여 상세 정보를 확인하세요.</p>
        </div>

        <!-- 선택 했을 때 -->
        <div v-else class="details-content">
          <!-- 기본 정보(항상 표시) -->
          <p><strong>아이콘:</strong> {{ selectedTransport.icon }}</p>
          <p><strong>종류:</strong> {{ selectedTransport.name }}</p>
          <p><strong>총 보유 차량:</strong> 0대</p>
          <p><strong>연구 완료 여부:</strong> {{ selectedTransport.locked ? '아니오' : '예' }}</p>

          <hr class="divider" />

          <!-- 프리뷰 시스템 잠금/오픈 -->
          <div v-if="!previewStarterFleetUnlocked" class="lock-box">
            <p class="lock-title">🔒 기본차량 프리뷰 시스템 잠김</p>
            <p class="lock-desc">
              기본차량 자동운행(프리뷰) 연구를 완료하면 이 영역에서
              <strong>초기 운행 데이터</strong>가 표시됩니다.
            </p>
            <p class="lock-desc subtle">
              (현재는 연구 파트만 서비스 중이므로, 프리뷰/차량/재정 등은 단계적으로 오픈됩니다.)
            </p>
          </div>

          <div v-else class="preview-box">
            <p class="preview-title">✅ 기본차량 프리뷰 활성화</p>
            <p class="preview-desc">
              현재는 표시용 레이아웃만 준비되어 있습니다. 다음 단계에서
              <strong>운행중/남은시간/재롤링</strong>을 연결합니다.
            </p>

            <!-- 이후 실제 데이터 들어갈 자리 -->
            <div class="preview-placeholder">
              <p class="placeholder-text">초기 운행 데이터 영역 (준비중)</p>
            </div>
          </div>

          <p class="details-placeholder">
            선택된 {{ selectedTransport.name }}의 운영 통계 및 관리 옵션이 이곳에 표시됩니다.
          </p>
        </div>
      </div>

      <!-- 3. 보유 자원 목록 -->
      <div class="resource-container">
        <h3 class="panel-heading">📦 보유 자원 📦</h3>
        <p v-if="!financeUnlocked" class="placeholder-text">재정을 해금해주세요.</p>
        <p v-else>현금: $10,000</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTransportUnlocks } from '@/composables/useTransportUnlocks';
import { useVehicles } from '@/composables/useVehicles';
import { useResearch } from '@/composables/useResearch';

// ✅ 운송 목록/상태는 어댑터에서 가져온다 (연구 엔진 순수화 대응)
const {
  transportTypes,
  unlockedTransports: unlockedRef,
  previewStarterFleetUnlocked,
} = useTransportUnlocks();

// 연구 완료 기반으로 "재정 해금 여부" 체크
const research = useResearch();
const financeUnlocked = computed(() => {
  return !!research.completedIds.value?.has?.('sys_unlock_finance');
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

<style scoped lang="scss">
@use '../styles/TheLeftArea.scss';

/* 이 파일만으로 잠금/프리뷰 박스가 깔끔하게 보이도록 최소 스타일 보강 */
.divider {
  margin: 12px 0;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
}

.lock-box,
.preview-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.18);
  margin-bottom: 10px;
}

.lock-title,
.preview-title {
  margin: 0 0 6px 0;
  font-weight: 800;
  font-size: 13px;
}

.lock-desc,
.preview-desc {
  margin: 0 0 6px 0;
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.35;
}

.lock-desc.subtle {
  opacity: 0.75;
}

.preview-placeholder {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  opacity: 0.9;
}
</style>
