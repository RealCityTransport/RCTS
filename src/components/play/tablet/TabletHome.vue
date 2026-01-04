<!-- src/components/play/tablet/TabletHome.vue -->
<template>
  <div class="tablet-home-root">
    <!-- 상단 환영/상태 영역 -->
    <section class="tablet-home-header">
      <div class="tablet-home-header-main">
        <p class="tablet-home-badge">CONTROL TABLET · HOME</p>
        <h2 class="tablet-home-title">RCTS 관제 테블릿</h2>
        <p class="tablet-home-subtitle">
          이 테블릿은 사장님의 관제 전용 디스플레이입니다.
          <br />
          나중에는 여기에서 회사 현황, 프로젝트, 노선 운행 상황을 한눈에 확인할 수 있어요.
        </p>
      </div>

      <aside class="tablet-home-header-side">
        <p class="tablet-home-status-label">현재 상태</p>
        <p class="tablet-home-status-value">
          {{ statusValue }}
        </p>
        <p class="tablet-home-status-hint">
          {{ statusHint }}
        </p>
      </aside>
    </section>

    <!-- 아이콘/타일 영역: 바탕화면 느낌 -->
    <section class="tablet-home-grid">
      <!-- 회사 생성/관리 -->
      <button
        type="button"
        class="tablet-home-tile"
        @click="handleCompanyTileClick"
      >
        <div class="tile-icon tile-icon--primary">
          <span class="tile-icon-letter">C</span>
        </div>
        <div class="tile-body">
          <p class="tile-title">
            {{ hasCompany ? '회사 정보 / 관리' : '회사 생성 / 등록' }}
          </p>
          <p class="tile-desc">
            {{
              hasCompany
                ? '등록된 회사의 기본 정보와 관제 기준 좌표를 확인·수정할 수 있어요.'
                : 'RCTS에서 사용할 첫 회사를 간단히 등록하는 단계입니다.'
            }}
          </p>
        </div>
      </button>

      <!-- 프로젝트 허브 -->
      <button type="button" class="tablet-home-tile">
        <div class="tile-icon tile-icon--accent">
          <span class="tile-icon-letter">P</span>
        </div>
        <div class="tile-body">
          <p class="tile-title">프로젝트 허브</p>
          <p class="tile-desc">
            배정된 시공·운송 프로젝트 목록과
            진행 상황을 모아서 보는 공간입니다. (준비 중)
          </p>
        </div>
      </button>

      <!-- 노선 / 운영 관제 -->
      <button type="button" class="tablet-home-tile">
        <div class="tile-icon tile-icon--route">
          <span class="tile-icon-letter">R</span>
        </div>
        <div class="tile-body">
          <p class="tile-title">노선 · 운행 관제</p>
          <p class="tile-desc">
            주요 노선과 차량들의 운행 흐름을
            모니터링하고 제어할 수 있는 화면으로 연결될 예정입니다.
          </p>
        </div>
      </button>

      <!-- 시스템 설정 -->
      <button type="button" class="tablet-home-tile">
        <div class="tile-icon tile-icon--settings">
          <span class="tile-icon-letter">S</span>
        </div>
        <div class="tile-body">
          <p class="tile-title">테블릿 / 시스템 설정</p>
          <p class="tile-desc">
            알림, 화면 모드, 계정 연동 등
            관제 테블릿 환경을 설정하는 메뉴가 들어올 자리입니다.
          </p>
        </div>
      </button>
    </section>

    <!-- 회사 생성 / 정보 / 수정 패널 -->
    <section
      v-if="panelMode === 'create' || panelMode === 'edit'"
      class="tablet-home-company-panel"
    >
      <header class="company-panel-header">
        <h3 class="company-panel-title">
          {{ panelMode === 'edit' ? '회사 정보 수정' : '첫 회사 생성' }}
        </h3>
        <p class="company-panel-subtitle">
          이 관제 테블릿에서 사용할 기본 회사를
          {{ panelMode === 'edit' ? '수정합니다.' : '등록합니다.' }}
          관제 화면은 <strong>본사 좌표(위도, 경도)</strong>를 기준으로 지형을 불러오게 돼요.
        </p>
      </header>

      <form class="company-form" @submit.prevent="handleCreateCompany">
        <div class="company-form-row">
          <label class="company-form-label">회사 이름</label>
          <input
            v-model="companyForm.name"
            type="text"
            class="company-form-input"
            placeholder="예: RCTS Transport"
            required
          />
        </div>

        <div class="company-form-row">
          <label class="company-form-label">
            본사 주소 (선택, 설명용 텍스트)
          </label>
          <input
            v-model="companyForm.hqLocation"
            type="text"
            class="company-form-input"
            placeholder="예: 수원시 영통구 ○○로 ○○"
          />
          <p class="company-form-hint">
            주소는 설명용 텍스트로만 사용됩니다. 실제 관제 중심은 아래 위도/경도로 결정돼요.
          </p>
        </div>

        <div class="company-form-row">
          <label class="company-form-label">본사 좌표 (위도 / 경도)</label>
          <div class="company-form-latlng">
            <input
              v-model="companyForm.hqLat"
              type="number"
              step="0.000001"
              class="company-form-input"
              placeholder="위도 (예: 37.123456)"
            />
            <input
              v-model="companyForm.hqLng"
              type="number"
              step="0.000001"
              class="company-form-input"
              placeholder="경도 (예: 127.123456)"
            />
          </div>
          <p class="company-form-hint">
            위도/경도를 입력하면, 관제 화면의 OSM 지형이 해당 좌표를 중심으로 표시됩니다.
          </p>
        </div>

        <div class="company-form-actions">
          <button
            type="button"
            class="company-form-button company-form-button--ghost"
            @click="closePanel"
          >
            취소
          </button>
          <button
            type="submit"
            class="company-form-button company-form-button--primary"
          >
            {{ panelMode === 'edit' ? '수정 내용 저장' : '회사 생성 완료' }}
          </button>
        </div>
      </form>
    </section>

    <section
      v-else-if="panelMode === 'view' && company"
      class="tablet-home-company-panel"
    >
      <header class="company-panel-header">
        <h3 class="company-panel-title">회사 정보</h3>
        <p class="company-panel-subtitle">
          현재 이 관제 테블릿에 연결된 회사의 기본 정보입니다.
          관제 화면의 OSM 지형은 아래에 표시된 본사 좌표를 기준으로 동작할 거예요.
        </p>
      </header>

      <div class="company-info-grid">
        <div class="company-info-item">
          <p class="company-info-label">회사 이름</p>
          <p class="company-info-value">{{ company.name }}</p>
        </div>

        <div class="company-info-item">
          <p class="company-info-label">본사 주소 (텍스트)</p>
          <p class="company-info-value">
            {{ company.hqLocation || '등록된 텍스트 주소 없음' }}
          </p>
        </div>

        <div class="company-info-item">
          <p class="company-info-label">본사 위도</p>
          <p class="company-info-value">
            {{
              typeof company.hqLat === 'number' && !Number.isNaN(company.hqLat)
                ? company.hqLat
                : '미설정'
            }}
          </p>
        </div>

        <div class="company-info-item">
          <p class="company-info-label">본사 경도</p>
          <p class="company-info-value">
            {{
              typeof company.hqLng === 'number' && !Number.isNaN(company.hqLng)
                ? company.hqLng
                : '미설정'
            }}
          </p>
        </div>

        <div class="company-info-item">
          <p class="company-info-label">등록 시각 (RCT 기준)</p>
          <p class="company-info-value">
            {{ company.createdAtText || '등록 시각 정보 없음' }}
          </p>
        </div>
      </div>

      <div class="company-form-actions">
        <button
          type="button"
          class="company-form-button company-form-button--ghost"
          @click="closePanel"
        >
          닫기
        </button>
        <button
          type="button"
          class="company-form-button"
          @click="handleEditCompany"
        >
          회사 정보 수정
        </button>
        <button
          type="button"
          class="company-form-button company-form-button--danger"
          @click="handleDeleteCompanyClick"
        >
          회사 삭제
        </button>
      </div>
    </section>

    <!-- 하단 작은 안내 -->
    <section class="tablet-home-footer">
      <p class="tablet-home-footer-text">
        지금은 바탕화면과 회사 등록만 준비된 상태입니다.
        회사 정보와 프로젝트 시스템을 하나씩 연결하면서,
        이 화면에서 대부분의 작업을 시작할 수 있게 만들 거예요.
      </p>
    </section>
  </div>
</template>

<script setup>
import { useCompanySetupForm } from './scripts/useCompanySetupForm'

const props = defineProps({
  /**
   * 계정에 저장된 회사 정보
   * - null 이면: 아직 회사 미생성 상태
   * - 객체이면: 이미 생성된 회사 (계정 도큐먼트 기준)
   */
  company: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['create-company', 'delete-company'])

const {
  panelMode,
  hasCompany,
  statusValue,
  statusHint,
  companyForm,
  handleCompanyTileClick,
  handleCreateCompany,
  handleEditCompany,
  closePanel,
} = useCompanySetupForm(props, emit)

function handleDeleteCompanyClick() {
  const ok = window.confirm(
    '정말로 현재 회사를 삭제하시겠습니까?\n관제 기준 좌표와 회사 정보가 모두 초기화됩니다.'
  )
  if (!ok) return
  emit('delete-company')
}
</script>

<style scoped>
.tablet-home-root {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #eef3ff;
}

/* 상단 헤더 */
.tablet-home-header {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-wrap: wrap;
}

.tablet-home-header-main {
  flex: 1 1 260px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tablet-home-badge {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.9;
  color: #cfe6ff;
}

.tablet-home-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.tablet-home-subtitle {
  font-size: 0.82rem;
  opacity: 0.92;
  line-height: 1.7;
  color: #e5ecff;
}

.tablet-home-header-side {
  flex: 0 0 220px;
  border-radius: 14px;
  padding: 12px 14px;
  background: linear-gradient(
      135deg,
      rgba(160, 210, 255, 0.22),
      rgba(40, 60, 110, 0.22)
    ),
    rgba(10, 18, 40, 0.95);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(180, 200, 255, 0.35);
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
}

.tablet-home-status-label {
  font-size: 0.76rem;
  opacity: 0.9;
  color: #d6e4ff;
}

.tablet-home-status-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
}

.tablet-home-status-hint {
  font-size: 0.75rem;
  opacity: 0.9;
  line-height: 1.6;
  color: #e5ecff;
}

/* 바탕화면 아이콘/타일 그리드 */
.tablet-home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* 타일 */
.tablet-home-tile {
  border: none;
  outline: none;
  padding: 12px 12px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(30, 50, 100, 0.9), rgba(15, 25, 60, 0.95));
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(200, 210, 255, 0.35);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
  color: #f3f7ff;
}

.tablet-home-tile:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(230, 240, 255, 0.6);
  background:
    linear-gradient(135deg, rgba(45, 75, 140, 0.95), rgba(20, 35, 80, 0.98));
}

/* 아이콘 */
.tile-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #101424;
}

.tile-icon--primary {
  background: linear-gradient(135deg, #9fdcff, #c9ffe9);
}

.tile-icon--accent {
  background: linear-gradient(135deg, #ffe4a8, #fff0cb);
}

.tile-icon--route {
  background: linear-gradient(135deg, #b8c6ff, #e2ecff);
}

.tile-icon--settings {
  background: linear-gradient(135deg, #d9deec, #ffffff);
}

.tile-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tile-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
}

.tile-desc {
  font-size: 0.78rem;
  opacity: 0.92;
  line-height: 1.55;
  color: #f0f4ff;
}

/* 회사 패널 공통 */
.tablet-home-company-panel {
  margin-top: 6px;
  padding: 14px 14px;
  border-radius: 16px;
  background: radial-gradient(
      circle at top left,
      rgba(120, 170, 255, 0.16),
      transparent 55%
    ),
    rgba(8, 14, 30, 0.96);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(190, 210, 255, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.company-panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-panel-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #ffffff;
}

.company-panel-subtitle {
  font-size: 0.78rem;
  color: #e1ebff;
  opacity: 0.95;
  line-height: 1.6;
}

/* 회사 생성/수정 폼 */
.company-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.company-form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-form-label {
  font-size: 0.78rem;
  color: #dbe6ff;
}

.company-form-input {
  border-radius: 10px;
  border: 1px solid rgba(190, 205, 255, 0.7);
  background: rgba(6, 10, 24, 0.9);
  padding: 6px 8px;
  font-size: 0.8rem;
  color: #f4f6ff;
  outline: none;
}

.company-form-input:focus {
  border-color: #a8c6ff;
  box-shadow: 0 0 0 1px rgba(168, 198, 255, 0.6);
}

.company-form-hint {
  font-size: 0.7rem;
  color: #cdd8ff;
  opacity: 0.9;
}

/* 위도/경도 2개 인풋 나란히 */
.company-form-latlng {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.company-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.company-form-button {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  border: none;
  cursor: pointer;
  outline: none;
  transition:
    background 0.12s ease,
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.company-form-button--primary {
  background: linear-gradient(135deg, #7fb2ff, #c3e1ff);
  color: #0c1628;
  font-weight: 600;
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(200, 220, 255, 0.7);
}

.company-form-button--primary:hover {
  transform: translateY(-1px);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(230, 240, 255, 0.9);
}

.company-form-button--ghost {
  background: transparent;
  color: #d7e3ff;
  border: 1px solid rgba(190, 205, 255, 0.6);
}

.company-form-button--ghost:hover {
  background: rgba(22, 32, 60, 0.85);
}

.company-form-button--danger {
  background: rgba(200, 50, 50, 0.1);
  color: #ffbaba;
  border: 1px solid rgba(255, 120, 120, 0.7);
}

.company-form-button--danger:hover {
  background: rgba(220, 60, 60, 0.25);
}

/* 회사 정보 그리드 */
.company-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 6px;
}

.company-info-item {
  padding: 8px 9px;
  border-radius: 12px;
  background: rgba(10, 18, 40, 0.9);
  border: 1px solid rgba(170, 190, 255, 0.6);
}

.company-info-label {
  font-size: 0.72rem;
  color: #cfd8ff;
  margin-bottom: 2px;
}

.company-info-value {
  font-size: 0.8rem;
  color: #ffffff;
}

/* 하단 안내 */
.tablet-home-footer-text {
  font-size: 0.75rem;
  opacity: 0.9;
  line-height: 1.6;
  color: #e8efff;
}

/* 반응형 */
@media (max-width: 640px) {
  .tablet-home-header {
    flex-direction: column;
  }

  .tablet-home-header-side {
    width: 100%;
  }

  .tablet-home-grid {
    grid-template-columns: 1fr;
  }

  .company-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
