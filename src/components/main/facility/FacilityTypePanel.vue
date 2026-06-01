<!--
RCTS FILE CONTEXT
파일 역할:
- 시설 메뉴 내부에서 선택한 교통수단의 시설 관리 패널을 표시한다.
- 버스, 철도, 항공, 선박, 우주선별 시설 타입과 조건을 보여준다.
- 시설 추가, 이름 변경, 삭제 요청을 부모(FacilityPage.vue)로 전달한다.

현재 연결:
- FacilityPage.vue에서 사용된다.
- selected-type props로 현재 선택한 교통수단 정보를 받는다.
- facilities props로 현재 등록된 시설 목록을 받는다.
- is-finance-unlocked props로 설치비 적용 여부를 판단한다.
- is-administration-unlocked props로 인허가 시간 적용 여부를 판단한다.
- add-facility 이벤트를 emit한다.
- rename-facility 이벤트를 emit한다.
- delete-facility 이벤트를 emit한다.

현재 규칙:
- 행정 메뉴가 해금되지 않았으면 시설 인허가 시간은 적용되지 않고 즉시 추가로 표시한다.
- 행정 메뉴가 해금되면 시설마다 인허가 시간이 표시된다.
- 재정 메뉴가 해금되지 않았으면 설치비용은 적용되지 않고 무료로 표시한다.
- 재정 메뉴가 해금되면 시설마다 설치비용이 표시된다.
- 시설 추가/수정/삭제의 실제 데이터 처리는 Home.vue에서 처리한다.

주의:
- 시설 메뉴는 단일 시설을 관리한다.
- 시설 간 거리와 연결은 운행 메뉴에서 담당한다.
- 시설 삭제 시 운행 초안에서 해당 시설이 제거되는 처리는 Home.vue가 담당한다.

다음 작업 방향:
- 시설 상세 패널.
- 시설 타입 변경 제한.
- 시설 사용 중 삭제 제한.
-->

<template>
  <section class="facility-panel">
    <section
      class="status-box"
      :class="{
        locked: !selectedType.unlocked,
        unavailable: !selectedType.available,
      }"
    >
      <div>
        <span>{{ selectedType.label }}</span>
        <h3>{{ selectedType.name }} 시설</h3>
        <p>{{ selectedType.description }}</p>
      </div>

      <strong>{{ statusText }}</strong>
    </section>

    <section class="rule-grid">
      <article class="rule-card" :class="{ active: isAdministrationUnlocked }">
        <span>ADMINISTRATION</span>
        <strong>인허가 조건</strong>
        <p>
          {{ isAdministrationUnlocked
            ? '행정 메뉴가 연결되어 시설별 인허가 시간이 적용됩니다.'
            : '행정 메뉴가 아직 없으므로 시설은 즉시 추가됩니다.' }}
        </p>
      </article>

      <article class="rule-card" :class="{ active: isFinanceUnlocked }">
        <span>FINANCE</span>
        <strong>설치 비용</strong>
        <p>
          {{ isFinanceUnlocked
            ? '재정 메뉴가 연결되어 시설별 설치비용이 적용됩니다.'
            : '재정 메뉴가 아직 없으므로 설치비용 없이 추가됩니다.' }}
        </p>
      </article>
    </section>

    <section class="facility-type-list">
      <div class="list-title">
        <div>
          <span>FACILITY TYPES</span>
          <h4>{{ selectedType.name }} 시설 종류</h4>
        </div>

        <strong>{{ selectedType.facilities.length }}개</strong>
      </div>

      <div class="facility-grid">
        <article
          v-for="facility in selectedType.facilities"
          :key="facility.id"
          class="facility-card"
          :class="{
            locked: !selectedType.unlocked,
            unavailable: !selectedType.available,
          }"
        >
          <div>
            <span>{{ facility.code }}</span>
            <strong>{{ facility.name }}</strong>
            <p>{{ facility.description }}</p>
          </div>

          <dl>
            <div>
              <dt>설치비용</dt>
              <dd>{{ getCostText(facility) }}</dd>
            </div>

            <div>
              <dt>인허가 시간</dt>
              <dd>{{ getPermitText(facility) }}</dd>
            </div>

            <div>
              <dt>상태</dt>
              <dd>{{ getFacilityStatusText }}</dd>
            </div>
          </dl>

          <button
            type="button"
            :disabled="!selectedType.unlocked || !selectedType.available"
            @click="addFacility(facility)"
          >
            {{ selectedType.unlocked && selectedType.available ? '시설 추가' : '잠김' }}
          </button>
        </article>
      </div>
    </section>

    <section class="registered-list">
      <div class="list-title">
        <div>
          <span>REGISTERED FACILITIES</span>
          <h4>등록된 {{ selectedType.name }} 시설</h4>
        </div>

        <strong>{{ selectedFacilities.length }}개</strong>
      </div>

      <div v-if="selectedFacilities.length" class="registered-grid">
        <article
          v-for="facility in selectedFacilities"
          :key="facility.id"
          class="registered-card"
        >
          <div class="registered-main">
            <form
              v-if="editingFacilityId === facility.id"
              class="rename-form"
              @submit.prevent="submitRename(facility.id)"
            >
              <input
                v-model.trim="editingName"
                type="text"
                maxlength="32"
                placeholder="시설명을 입력하세요"
              />

              <div class="rename-actions">
                <button type="submit">
                  저장
                </button>

                <button
                  type="button"
                  class="subtle"
                  @click="cancelRename"
                >
                  취소
                </button>
              </div>
            </form>

            <template v-else>
              <strong>{{ facility.name }}</strong>
              <span>{{ facility.facilityTypeName }}</span>
            </template>
          </div>

          <small>{{ getStatusLabel(facility.status) }}</small>

          <div v-if="editingFacilityId !== facility.id" class="registered-actions">
            <button
              type="button"
              @click="startRename(facility)"
            >
              이름 변경
            </button>

            <button
              type="button"
              class="danger"
              @click="deleteFacility(facility.id)"
            >
              삭제
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty-box">
        <strong>아직 등록된 시설이 없습니다.</strong>
        <span>시설을 추가하면 이곳에 데이터로 표시되고, 운행 메뉴에서 불러올 수 있습니다.</span>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  selectedType: {
    type: Object,
    required: true,
  },
  facilities: {
    type: Array,
    default: () => [],
  },
  isFinanceUnlocked: {
    type: Boolean,
    default: false,
  },
  isAdministrationUnlocked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'add-facility',
  'rename-facility',
  'delete-facility',
])

const editingFacilityId = ref('')
const editingName = ref('')

const statusText = computed(() => {
  if (!props.selectedType.available) {
    return '미개발'
  }

  if (!props.selectedType.unlocked) {
    return '연구 필요'
  }

  return '사용 가능'
})

const getFacilityStatusText = computed(() => {
  if (!props.selectedType.available) {
    return '미개발'
  }

  if (!props.selectedType.unlocked) {
    return '연구 필요'
  }

  return '추가 가능'
})

const selectedFacilities = computed(() => {
  return props.facilities.filter((facility) => {
    return facility.transportTypeId === props.selectedType.id
  })
})

function addFacility(facility) {
  if (!props.selectedType.unlocked || !props.selectedType.available) {
    return
  }

  emit('add-facility', {
    transportTypeId: props.selectedType.id,
    transportTypeName: props.selectedType.name,
    facilityTypeId: facility.id,
    facilityTypeName: facility.name,
    cost: facility.cost,
    permitMinutes: facility.permitMinutes,
  })
}

function startRename(facility) {
  editingFacilityId.value = facility.id
  editingName.value = facility.name
}

function cancelRename() {
  editingFacilityId.value = ''
  editingName.value = ''
}

function submitRename(facilityId) {
  const nextName = editingName.value.trim()

  if (!nextName) {
    return
  }

  emit('rename-facility', {
    id: facilityId,
    name: nextName,
  })

  cancelRename()
}

function deleteFacility(facilityId) {
  emit('delete-facility', facilityId)

  if (editingFacilityId.value === facilityId) {
    cancelRename()
  }
}

function getCostText(facility) {
  if (!props.isFinanceUnlocked) {
    return '비용 없음'
  }

  return `${facility.cost.toLocaleString()} R`
}

function getPermitText(facility) {
  if (!props.isAdministrationUnlocked) {
    return '즉시 추가'
  }

  return `${facility.permitMinutes}분`
}

function getStatusLabel(status) {
  if (status === 'permit-pending') {
    return '인허가 대기'
  }

  if (status === 'active') {
    return '사용 가능'
  }

  return '상태 미확인'
}
</script>

<style scoped>
.facility-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-box {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.status-box.locked {
  border-color: #dbe3ef;
  background: #f8fafc;
}

.status-box.unavailable {
  opacity: 0.72;
  filter: grayscale(0.35);
}

.status-box span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.status-box h3 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 26px;
}

.status-box p {
  max-width: 780px;
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.status-box strong {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: #1e3a8a;
  color: white;
  font-size: 13px;
  font-weight: 900;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.rule-card,
.facility-type-list,
.registered-list {
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.rule-card.active {
  border-color: #f59e0b;
  background: #fff7ed;
}

.rule-card span,
.list-title span,
.facility-card span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.rule-card strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 18px;
}

.rule-card p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

.list-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.list-title h4 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.list-title strong {
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.facility-grid,
.registered-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.facility-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.facility-card.locked,
.facility-card.unavailable {
  opacity: 0.65;
  filter: grayscale(0.35);
}

.facility-card strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 18px;
}

.facility-card p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.facility-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.facility-card dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.facility-card dd {
  margin: 5px 0 0;
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.facility-card button {
  height: 38px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.facility-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

.registered-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.registered-main {
  min-width: 0;
}

.registered-card strong {
  display: block;
  color: #111827;
  font-size: 15px;
}

.registered-card span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.registered-card small {
  justify-self: end;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 900;
}

.registered-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
}

.registered-actions button,
.rename-actions button {
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: var(--blue);
  color: white;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.registered-actions button.danger {
  background: #dc2626;
}

.rename-actions button.subtle {
  background: #64748b;
}

.rename-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  width: 100%;
}

.rename-form input {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  outline: none;
}

.rename-form input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.rename-actions {
  display: flex;
  gap: 6px;
}

.empty-box {
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
}

.empty-box strong {
  color: #111827;
  font-size: 17px;
}

.empty-box span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1020px) {
  .rule-grid,
  .facility-grid,
  .registered-grid {
    grid-template-columns: 1fr;
  }

  .facility-card dl {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .status-box,
  .list-title,
  .registered-card {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }

  .registered-card small {
    justify-self: start;
  }

  .rename-form {
    grid-template-columns: 1fr;
  }

  .rename-actions,
  .registered-actions {
    flex-wrap: wrap;
  }
}
</style>