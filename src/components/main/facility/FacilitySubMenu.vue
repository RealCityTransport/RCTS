<!--
RCTS FILE CONTEXT
파일 역할:
- 시설 메뉴 내부의 2차 교통수단 메뉴를 담당한다.
- 현재 2차 메뉴는 버스, 철도, 항공, 선박, 우주선으로 구성된다.

현재 연결:
- FacilityPage.vue에서 사용된다.
- transport-types props를 받아 버튼 목록을 출력한다.
- active-type props로 현재 선택된 시설 교통수단을 표시한다.
- select-type 이벤트로 선택된 type id를 부모에게 전달한다.

현재 규칙:
- 모든 2차 메뉴는 표시된다.
- 연구가 완료되지 않은 교통수단은 잠김으로 표시된다.
- 우선 버스 시설만 연구로 해금 가능하다.
- 철도/항공/선박/우주선은 표시만 하며 미개발 상태다.

주의:
- 실제 시설 목록이나 시설 생성 기능은 이 컴포넌트에 넣지 않는다.
- 이 컴포넌트는 2차 메뉴 출력만 담당한다.

다음 작업 방향:
- 교통수단별 알림 배지.
- 보유 시설 수 표시.
- 미개발/연구필요/사용가능 상태 구분 강화.
-->

<template>
  <nav class="facility-sub-menu">
    <button
      v-for="type in transportTypes"
      :key="type.id"
      type="button"
      :class="{
        active: activeType === type.id,
        locked: !type.unlocked,
        unavailable: !type.available,
      }"
      @click="emit('select-type', type.id)"
    >
      <span>{{ type.icon }}</span>
      <strong>{{ type.name }}</strong>
      <small v-if="!type.available">미개발</small>
      <small v-else-if="!type.unlocked">잠김</small>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  transportTypes: {
    type: Array,
    required: true,
  },
  activeType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select-type'])
</script>

<style scoped>
.facility-sub-menu {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.facility-sub-menu button {
  min-height: 46px;
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: white;
  color: #334155;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}

.facility-sub-menu button:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.facility-sub-menu button.active {
  border-color: var(--blue);
  background: var(--blue);
  color: white;
}

.facility-sub-menu button.locked,
.facility-sub-menu button.unavailable {
  opacity: 0.62;
  filter: grayscale(0.35);
}

.facility-sub-menu span {
  text-align: center;
}

.facility-sub-menu small {
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  font-size: 10px;
  font-weight: 900;
}

@media (max-width: 1180px) {
  .facility-sub-menu {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .facility-sub-menu {
    grid-template-columns: 1fr;
  }
}
</style>