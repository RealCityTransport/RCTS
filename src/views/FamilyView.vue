<!--
  파일명: src/views/FamilyView.vue

  역할:
  - 숨김형 관계/가족 상태 페이지입니다.
  - 배우자 지정 전에는 임신/자녀 상태를 노출하지 않습니다.
  - 배우자 지정 후 표준시간 기준으로 부부 개인 시간, 임신 확인, 태아 성장, 출산 상태가 진행됩니다.
-->

<template>
  <section class="page">
    <header class="page-title compact-title">
      <div>
        <p>HIDDEN STATE</p>
        <h2>관계 / 가족</h2>
      </div>
      <span>{{ familyStatusLabels[terrariaState.family.status] }}</span>
    </header>

    <article v-if="!terrariaState.initialized" class="panel">
      <div class="panel-inner empty">
        먼저 본부에서 회사와 사장 프로필을 생성해 주세요.
      </div>
    </article>

    <template v-else>
      <section class="grid compact-grid">
        <article class="panel" :style="relationPanelStyle">
          <header class="panel-head">
            <div>
              <p>RELATION</p>
              <h3>현재 관계</h3>
            </div>
            <span class="pill">{{ familyStatusLabels[terrariaState.family.status] }}</span>
          </header>

          <div class="panel-inner compact-list">
            <div class="mini-card">
              <span>사장</span>
              <strong>{{ terrariaState.player.fullName }}</strong>
              <p>{{ getGenderLabel(terrariaState.player.gender) }} · {{ getAge(terrariaState.player) }}세</p>
            </div>

            <div v-if="spouse" class="mini-card">
              <span>배우자</span>
              <strong>{{ spouse.fullName }}</strong>
              <p>{{ spouseModeText }} · {{ getGenderLabel(spouse.gender) }} · {{ getAge(spouse) }}세</p>
            </div>

            <div v-else class="empty compact-empty">
              배우자 상태가 없습니다.
            </div>

            <button
              v-if="spouse && terrariaState.family.spouseWorkMode === 'active'"
              type="button"
              class="ghost-button full-button"
              @click="setSpouseWorkMode('family')"
            >
              배우자 역할로 전환
            </button>
          </div>
        </article>

        <article v-if="terrariaState.family.status === 'single'" class="panel" style="grid-column: span 7;">
          <header class="panel-head">
            <div>
              <p>SPOUSE SETUP</p>
              <h3>배우자 지정</h3>
            </div>
          </header>

          <div class="panel-inner compact-list">
            <div v-if="possibleSpouses.length > 0" class="spouse-list">
              <article
                v-for="secretary in possibleSpouses"
                :key="secretary.id"
                class="item-card compact-card"
              >
                <h4>{{ secretary.fullName }}</h4>
                <p>{{ secretary.departmentName }} · {{ secretary.role }} · {{ getGenderLabel(secretary.gender) }} · {{ getAge(secretary) }}세</p>

                <div class="button-row compact-buttons">
                  <button type="button" class="primary-button" @click="marrySecretary({ secretaryId: secretary.id, spouseWorkMode: 'active' })">
                    직책 유지
                  </button>

                  <button type="button" class="ghost-button" @click="marrySecretary({ secretaryId: secretary.id, spouseWorkMode: 'family' })">
                    배우자 전환
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="empty compact-empty">
              지정 가능한 다른 성별 비서가 없습니다.
            </div>
          </div>
        </article>

        <article v-if="spouse" class="panel" style="grid-column: span 5;">
          <header class="panel-head">
            <div>
              <p>PRIVATE</p>
              <h3>부부 개인 시간</h3>
            </div>
            <span class="pill">24시간 제한</span>
          </header>

          <div class="panel-inner compact-list">
            <div class="mini-card">
              <span>활성 상태</span>
              <strong>{{ privateTimeAvailabilityText }}</strong>
              <p v-if="terrariaState.family.privateTime?.latestAt">마지막 {{ formatDate(terrariaState.family.privateTime.latestAt) }}</p>
            </div>

            <button
              type="button"
              class="primary-button full-button"
              :disabled="!canUsePrivateTime"
              @click="activatePrivateTime"
            >
              부부 개인 시간 활성화
            </button>
          </div>
        </article>

        <article v-if="spouse" class="panel" style="grid-column: span 7;">
          <header class="panel-head">
            <div>
              <p>PREGNANCY</p>
              <h3>임신 / 태아</h3>
            </div>
            <span class="pill">{{ pregnancyLabel }}</span>
          </header>

          <div class="panel-inner compact-list">
            <div v-if="!pregnancy.active" class="empty compact-empty">
              확인된 변화가 없습니다.
            </div>

            <template v-else>
              <div v-if="pregnancy.target === 'spouse' && pregnancy.confirmed" class="notice-card compact-notice">
                <strong>{{ spouse.fullName }}</strong>
                <p>저 임신했어요.</p>
              </div>

              <div v-if="pregnancy.target === 'player' && pregnancy.symptomsNotified && !pregnancy.confirmed" class="notice-card compact-notice">
                <strong>{{ terrariaState.player.fullName }}</strong>
                <p>몸이 이상합니다. 병원 진료를 받아보세요.</p>
                <button type="button" class="primary-button full-button" @click="confirmPlayerPregnancyVisit">
                  병원 진료 확인
                </button>
              </div>

              <div v-if="pregnancy.confirmed" class="pregnancy-box">
                <div class="mini-card">
                  <span>진행</span>
                  <strong>{{ pregnancyWeek }}주차</strong>
                  <p>예정일 {{ formatDate(pregnancy.dueAt) }}</p>
                </div>

                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: `${pregnancyProgress}%` }"></div>
                </div>

                <p class="progress-text">태아 성장 {{ pregnancyProgress }}%</p>
              </div>

              <div v-if="pregnancy.birthReady && pregnancy.pendingBirth" class="birth-box">
                <div class="notice-card compact-notice">
                  <strong>출산</strong>
                  <p>아이가 태어났습니다. 성별은 {{ getGenderLabel(pregnancy.pendingBirth.gender) }}입니다.</p>
                </div>

                <div class="birth-form">
                  <label class="field">
                    <span>자녀 이름</span>
                    <input v-model="birthDraft.givenName" placeholder="이름만 입력" />
                  </label>

                  <button type="button" class="primary-button" @click="completeBirth">
                    이름 확정
                  </button>
                </div>
              </div>
            </template>
          </div>
        </article>

        <article v-if="spouse" class="panel" style="grid-column: span 12;">
          <header class="panel-head">
            <div>
              <p>CHILDREN</p>
              <h3>자녀</h3>
            </div>
          </header>

          <div class="panel-inner">
            <div v-if="terrariaState.family.children.length > 0" class="child-grid">
              <article v-for="child in terrariaState.family.children" :key="child.id" class="item-card compact-card">
                <h4>{{ child.fatherSurname }}{{ child.givenName }}</h4>
                <p>{{ getGenderLabel(child.gender) }} · {{ getAge(child) }}세 · 생일 {{ child.birthMonth }}월 {{ child.birthDay }}일</p>
              </article>
            </div>

            <div v-else class="empty compact-empty">
              등록된 자녀가 없습니다.
            </div>
          </div>
        </article>

        <article v-else class="panel" style="grid-column: span 12;">
          <div class="panel-inner empty compact-empty">
            임신/자녀 상태는 배우자 지정 후 활성화됩니다.
          </div>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'

import { formatDateTime } from '../modules/time'
import {
  activatePrivateTimeNow,
  canActivatePrivateTimeNow,
  confirmPlayerPregnancyVisit,
  familyStatusLabels,
  finalizeChildBirth,
  getAge,
  getGenderLabel,
  getPregnancyProgressPercent,
  getPregnancyWeek,
  getPrivateTimeAvailabilityText,
  getSecretaryById,
  marrySecretary,
  setSpouseWorkMode,
  terrariaState,
  updateFamilyLifecycle,
} from '../stores/terrariaManager'

updateFamilyLifecycle()

const birthDraft = reactive({
  givenName: '',
})

const spouse = computed(() => getSecretaryById(terrariaState.family.spouseNpcId))
const pregnancy = computed(() => terrariaState.family.pregnancy)

const possibleSpouses = computed(() => {
  return terrariaState.secretaries.filter((secretary) => {
    return secretary.gender !== terrariaState.player.gender && secretary.workStatus === 'active'
  })
})

const relationPanelStyle = computed(() => {
  return terrariaState.family.status === 'single'
    ? 'grid-column: span 5;'
    : 'grid-column: span 12;'
})

const spouseModeText = computed(() => {
  if (!spouse.value) return '-'
  return terrariaState.family.spouseWorkMode === 'family'
    ? '배우자'
    : spouse.value.role
})

const canUsePrivateTime = computed(() => canActivatePrivateTimeNow())
const privateTimeAvailabilityText = computed(() => getPrivateTimeAvailabilityText())

const activatePrivateTime = () => {
  activatePrivateTimeNow()
}

const pregnancyWeek = computed(() => getPregnancyWeek())
const pregnancyProgress = computed(() => getPregnancyProgressPercent())

const pregnancyLabel = computed(() => {
  if (!pregnancy.value.active) {
    return '변화 없음'
  }

  if (pregnancy.value.birthReady) {
    return '출산'
  }

  if (pregnancy.value.confirmed) {
    return '임신 확인'
  }

  if (pregnancy.value.symptomsNotified) {
    return '확인 필요'
  }

  return '변화 없음'
})

const formatDate = (value) => {
  return value ? formatDateTime(value) : '-'
}

const completeBirth = () => {
  const child = finalizeChildBirth({ givenName: birthDraft.givenName })

  if (child) {
    birthDraft.givenName = ''
  }
}
</script>

<style scoped>
.compact-title {
  margin-bottom: 1rem;
}

.compact-grid {
  gap: 0.85rem;
}

.compact-list {
  display: grid;
  gap: 0.75rem;
}

.spouse-list,
.child-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.7rem;
}

.compact-card {
  padding: 0.85rem;
}

.compact-card h4 {
  margin-bottom: 0.25rem;
}

.compact-buttons {
  margin-top: 0.7rem;
  gap: 0.6rem;
}

.mini-card {
  padding: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 0.9rem;
  background: rgba(15, 23, 42, 0.52);
}

.mini-card span {
  display: block;
  margin-bottom: 0.25rem;
  color: #94a3b8;
  font-size: 0.78rem;
}

.mini-card strong {
  display: block;
  color: #f8fafc;
  font-size: 1rem;
}

.mini-card p,
.notice-card p,
.progress-text,
.compact-card p {
  margin: 0.3rem 0 0;
  color: #94a3b8;
  line-height: 1.45;
}

.compact-empty {
  padding: 0.9rem;
}

.full-button {
  width: 100%;
}

.notice-card {
  padding: 1rem;
  border: 1px solid rgba(125, 211, 252, 0.28);
  border-radius: 1rem;
  background: rgba(14, 165, 233, 0.09);
}

.compact-notice {
  padding: 0.85rem;
}

.notice-card strong {
  display: block;
  color: #e0f2fe;
  margin-bottom: 0.3rem;
}

.pregnancy-box,
.birth-box {
  display: grid;
  gap: 0.75rem;
}

.progress-track {
  height: 0.55rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.85), rgba(168, 85, 247, 0.85));
}

.birth-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 0.7rem;
  align-items: end;
}

@media (max-width: 860px) {
  [style*='grid-column'] {
    grid-column: auto !important;
  }

  .birth-form {
    grid-template-columns: 1fr;
  }

  .birth-form button,
  .compact-buttons button {
    width: 100%;
  }
}
</style>
