<!--
RCTS FILE CONTEXT
파일 역할:
- 회사 메뉴 내부의 설정 패널.
- settings-basic 연구 완료 후 접근 가능한 회사 설정 영역이다.
- save-local-basic 연구 완료 후 설정 > 데이터 영역에서 수동 저장 기능을 사용할 수 있다.

현재 연결:
- CompanyPage.vue에서 activeTab === 'settings'일 때 표시된다.
- company props를 받는다.
- completedResearch props를 받는다.
- isSettingsUnlocked props를 받는다.
- storageInfo, storageMessage, storageBusy props를 받는다.
- save-world, load-world, delete-world 이벤트를 부모로 전달한다.

현재 규칙:
- 설정 탭 자체가 잠겨 있으면 CompanyPage.vue에서 접근을 막는다.
- 저장은 자동저장이 아니라 수동저장이다.
- 저장 위치는 브라우저 IndexedDB다.
- 저장 데이터 삭제도 가능하다.
- 외부저장, 자동저장, 서버저장은 아직 미제공으로 표시만 한다.

주의:
- 이 컴포넌트는 회사 설정 UI만 담당한다.
- 실제 저장/불러오기/삭제 로직은 Home.vue와 worldStorage.js에서 처리한다.

다음 작업 방향:
- 다중 저장 슬롯.
- 외부 JSON 내보내기/가져오기.
- 서버 백업.
- 자동저장 연구 및 기능.
-->

<template>
  <section class="company-section settings-section">
    <div class="section-heading">
      <div>
        <span>COMPANY SETTINGS</span>
        <h3>회사 설정</h3>
      </div>

      <strong>{{ isSettingsUnlocked ? '개방됨' : '잠김' }}</strong>
    </div>

    <p>
      회사 설정 기능은 개방되었습니다.
      데이터 영역에서는 연구 완료 후 브라우저 IndexedDB 기반 수동 저장을 사용할 수 있습니다.
    </p>

    <section class="settings-group">
      <div class="group-title">
        <span>GENERAL</span>
        <h4>일반</h4>
      </div>

      <div class="settings-grid">
        <article class="setting-card">
          <div>
            <strong>회사명</strong>
            <span>{{ companyName }}</span>
          </div>

          <small>회사명 변경 기능 준비중</small>
        </article>

        <article class="setting-card">
          <div>
            <strong>운영 성향</strong>
            <span>기본형</span>
          </div>

          <small>운영 성향 설정 준비중</small>
        </article>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title data-title">
        <div>
          <span>DATA</span>
          <h4>데이터</h4>
        </div>

        <strong>{{ isLocalSaveUnlocked ? '수동 저장 가능' : '저장 연구 필요' }}</strong>
      </div>

      <div class="storage-summary">
        <dl>
          <div>
            <dt>저장 방식</dt>
            <dd>브라우저 IndexedDB</dd>
          </div>

          <div>
            <dt>저장 데이터</dt>
            <dd>{{ storageInfo.hasSavedData ? '있음' : '없음' }}</dd>
          </div>

          <div>
            <dt>마지막 저장</dt>
            <dd>{{ savedAtText }}</dd>
          </div>

          <div>
            <dt>상태</dt>
            <dd>{{ storageBusy ? '처리중' : '대기중' }}</dd>
          </div>
        </dl>

        <p v-if="storageMessage">
          {{ storageMessage }}
        </p>
      </div>

      <div class="settings-grid">
        <article class="setting-card important" :class="{ locked: !isLocalSaveUnlocked }">
          <div>
            <strong>수동 저장</strong>
            <span>현재 월드 상태를 IndexedDB에 직접 저장합니다.</span>
          </div>

          <button
            type="button"
            :disabled="!isLocalSaveUnlocked || storageBusy"
            @click="emit('save-world')"
          >
            저장
          </button>
        </article>

        <article class="setting-card important" :class="{ locked: !isLocalSaveUnlocked }">
          <div>
            <strong>불러오기</strong>
            <span>IndexedDB에 저장된 월드 상태를 불러옵니다.</span>
          </div>

          <button
            type="button"
            :disabled="!isLocalSaveUnlocked || !storageInfo.hasSavedData || storageBusy"
            @click="emit('load-world')"
          >
            불러오기
          </button>
        </article>

        <article class="setting-card danger" :class="{ locked: !isLocalSaveUnlocked }">
          <div>
            <strong>저장 데이터 삭제</strong>
            <span>브라우저 IndexedDB에 저장된 월드 데이터를 삭제합니다.</span>
          </div>

          <button
            type="button"
            :disabled="!isLocalSaveUnlocked || !storageInfo.hasSavedData || storageBusy"
            @click="emit('delete-world')"
          >
            삭제
          </button>
        </article>

        <article class="setting-card unavailable">
          <div>
            <strong>외부 저장</strong>
            <span>JSON 파일 내보내기/가져오기 기능입니다.</span>
          </div>

          <button type="button" disabled>
            미제공
          </button>
        </article>

        <article class="setting-card unavailable">
          <div>
            <strong>자동저장</strong>
            <span>일정 간격으로 자동 저장하는 기능입니다.</span>
          </div>

          <button type="button" disabled>
            미제공
          </button>
        </article>

        <article class="setting-card unavailable">
          <div>
            <strong>서버 저장</strong>
            <span>서버 또는 Firebase 백업 저장 기능입니다.</span>
          </div>

          <button type="button" disabled>
            미제공
          </button>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  company: {
    type: Object,
    default: null,
  },
  completedResearch: {
    type: Array,
    default: () => [],
  },
  isSettingsUnlocked: {
    type: Boolean,
    default: false,
  },
  storageInfo: {
    type: Object,
    default: () => ({
      hasSavedData: false,
      savedAt: null,
      version: null,
    }),
  },
  storageMessage: {
    type: String,
    default: '',
  },
  storageBusy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'save-world',
  'load-world',
  'delete-world',
])

const companyName = computed(() => {
  return props.company?.name || '회사'
})

const isLocalSaveUnlocked = computed(() => {
  return props.completedResearch.includes('save-local-basic')
})

const savedAtText = computed(() => {
  if (!props.storageInfo.savedAt) {
    return '-'
  }

  return formatDateTime(props.storageInfo.savedAt)
})

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${hour}:${minute}`
}
</script>

<style scoped>
.company-section {
  padding: 20px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #ffffff;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-heading span {
  display: block;
  color: var(--blue);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.section-heading h3 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 24px;
}

.section-heading strong {
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 900;
}

.company-section > p {
  max-width: 760px;
  margin: 10px 0 22px;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.settings-group {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.group-title {
  margin-bottom: 14px;
}

.data-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.group-title span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.group-title h4 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.group-title strong {
  color: #1e3a8a;
  font-size: 14px;
  font-weight: 900;
}

.storage-summary {
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.storage-summary dl {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.storage-summary dl div {
  min-width: 0;
}

.storage-summary dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.storage-summary dd {
  margin: 5px 0 0;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  word-break: keep-all;
}

.storage-summary p {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.setting-card {
  min-height: 104px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.setting-card.important {
  border-color: #93c5fd;
  background: #eff6ff;
}

.setting-card.danger {
  border-color: #fecaca;
  background: #fff7f7;
}

.setting-card.unavailable,
.setting-card.locked {
  opacity: 0.58;
  filter: grayscale(0.35);
}

.setting-card strong {
  display: block;
  color: #111827;
  font-size: 16px;
}

.setting-card span {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.setting-card small {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.setting-card button {
  height: 38px;
  min-width: 78px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.setting-card.danger button {
  background: #dc2626;
}

.setting-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

@media (max-width: 1100px) {
  .settings-grid,
  .storage-summary dl {
    grid-template-columns: 1fr;
  }

  .setting-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .section-heading,
  .data-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>