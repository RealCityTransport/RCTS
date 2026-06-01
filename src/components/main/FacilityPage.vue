<!--
RCTS FILE CONTEXT
파일 역할:
- 시설 메뉴의 기본 페이지.
- 시설은 역, 정류장, 터미널, 차고지 같은 단일 시설을 관리하는 영역이다.
- 시설과 시설 사이의 거리 설정은 이곳이 아니라 운행 메뉴에서 담당한다.
- 시설 메뉴 내부는 버스, 철도, 항공, 선박, 우주선 2차 메뉴로 나뉜다.

현재 연결:
- Home.vue에서 activeMenu === 'facility'일 때 표시된다.
- completedResearch props를 받는다.
- facilities props를 받는다.
- add-facility 이벤트로 Home.vue에 시설 추가 요청을 전달한다.
- rename-facility 이벤트로 Home.vue에 시설 이름 변경 요청을 전달한다.
- delete-facility 이벤트로 Home.vue에 시설 삭제 요청을 전달한다.
- BaseMainPage.vue를 사용해 메인 페이지 포맷을 통일한다.
- FacilitySubMenu.vue로 2차 메뉴를 표시한다.
- FacilityTypePanel.vue로 선택된 교통수단의 시설 조건과 시설 목록을 표시한다.

현재 규칙:
- 시설 메뉴는 facility-basic 연구 완료 후 좌측 메뉴에서 클릭 가능해진다.
- 버스 시설은 facility-bus-basic 연구 완료 후 사용 가능으로 표시된다.
- 시설 추가 시 Home.vue의 facilities 배열에 데이터로 저장된다.
- 시설 이름 변경 시 운행 메뉴에서도 변경된 이름으로 표시된다.
- 시설 삭제 시 운행 초안에서도 자동 제거된다.
- 시설 간 거리와 순서는 운행 메뉴에서 담당한다.

주의:
- 시설 메뉴는 단일 지점 관리 영역이다.
- 거리, 노선, 배차, 선로 구조는 운행 메뉴에서 담당한다.

다음 작업 방향:
- 시설 상세 정보.
- 시설 타입 변경 제한.
- 시설 사용 중 삭제 제한.
-->

<template>
  <BaseMainPage
    eyebrow="FACILITY"
    title="시설"
    description="역, 정류장, 터미널, 차고지 같은 단일 시설을 관리하는 공간입니다. 시설 간 거리와 노선 설정은 운행 메뉴에서 담당합니다."
    badge="기초 메뉴"
  >
    <section class="facility-page-shell">
      <section class="notice-box">
        <strong>시설은 월드 데이터의 단일 지점입니다.</strong>
        <p>
          여기서 추가한 시설은 데이터로 저장되고, 운행 메뉴에서 불러와 순서와 구간 거리를 설정하는 기준점이 됩니다.
        </p>
      </section>

      <FacilitySubMenu
        :transport-types="transportTypes"
        :active-type="activeType"
        @select-type="selectType"
      />

      <FacilityTypePanel
        :selected-type="selectedType"
        :facilities="facilities"
        :is-finance-unlocked="isFinanceUnlocked"
        :is-administration-unlocked="isAdministrationUnlocked"
        @add-facility="emit('add-facility', $event)"
        @rename-facility="emit('rename-facility', $event)"
        @delete-facility="emit('delete-facility', $event)"
      />
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseMainPage from './BaseMainPage.vue'
import FacilitySubMenu from './facility/FacilitySubMenu.vue'
import FacilityTypePanel from './facility/FacilityTypePanel.vue'

const props = defineProps({
  completedResearch: {
    type: Array,
    default: () => [],
  },
  facilities: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'add-facility',
  'rename-facility',
  'delete-facility',
])

const activeType = ref('bus')

const isFinanceUnlocked = computed(() => {
  return props.completedResearch.includes('finance-basic')
})

const isAdministrationUnlocked = computed(() => {
  return props.completedResearch.includes('administration-basic')
})

const transportTypes = computed(() => {
  return [
    {
      id: 'bus',
      name: '버스',
      label: 'BUS FACILITY',
      icon: '🚌',
      requiredResearch: 'facility-bus-basic',
      available: true,
      unlocked: props.completedResearch.includes('facility-bus-basic'),
      description: '버스 정류장, 버스 터미널, 버스 차고지 같은 도로 기반 시설을 관리합니다.',
      facilities: [
        {
          id: 'bus-stop',
          code: 'STOP',
          name: '버스 정류장',
          description: '가장 기본적인 버스 승하차 시설입니다.',
          cost: 300,
          permitMinutes: 10,
        },
        {
          id: 'bus-terminal',
          code: 'TERM',
          name: '버스 터미널',
          description: '장거리, 광역, 환승 중심 버스 시설입니다.',
          cost: 1800,
          permitMinutes: 60,
        },
        {
          id: 'bus-depot',
          code: 'DEPOT',
          name: '버스 차고지',
          description: '차량 대기, 출고, 회차, 정비의 기반이 되는 시설입니다.',
          cost: 2500,
          permitMinutes: 90,
        },
      ],
    },
    {
      id: 'rail',
      name: '철도',
      label: 'RAIL FACILITY',
      icon: '🚆',
      requiredResearch: 'facility-rail-basic',
      available: false,
      unlocked: props.completedResearch.includes('facility-rail-basic'),
      description: '철도역, 승강장, 차량기지 같은 철도 기반 시설을 관리합니다.',
      facilities: [
        {
          id: 'rail-station',
          code: 'STATION',
          name: '철도역',
          description: '철도 승하차와 열차 정차의 기본 시설입니다.',
          cost: 8000,
          permitMinutes: 180,
        },
        {
          id: 'rail-yard',
          code: 'YARD',
          name: '차량기지',
          description: '열차 대기, 정비, 회송의 중심 시설입니다.',
          cost: 12000,
          permitMinutes: 240,
        },
      ],
    },
    {
      id: 'air',
      name: '항공',
      label: 'AIR FACILITY',
      icon: '✈',
      requiredResearch: 'facility-air-basic',
      available: false,
      unlocked: props.completedResearch.includes('facility-air-basic'),
      description: '공항, 활주로, 게이트 같은 항공 기반 시설을 관리합니다.',
      facilities: [
        {
          id: 'airport',
          code: 'AIRPORT',
          name: '공항',
          description: '항공기 이착륙과 승객 처리를 담당하는 시설입니다.',
          cost: 50000,
          permitMinutes: 480,
        },
        {
          id: 'runway',
          code: 'RUNWAY',
          name: '활주로',
          description: '항공기 이륙과 착륙에 필요한 핵심 시설입니다.',
          cost: 30000,
          permitMinutes: 360,
        },
      ],
    },
    {
      id: 'ship',
      name: '선박',
      label: 'SHIP FACILITY',
      icon: '⛴',
      requiredResearch: 'facility-ship-basic',
      available: false,
      unlocked: props.completedResearch.includes('facility-ship-basic'),
      description: '항만, 선착장, 여객터미널 같은 선박 기반 시설을 관리합니다.',
      facilities: [
        {
          id: 'port',
          code: 'PORT',
          name: '항만',
          description: '여객선과 화물선의 입출항을 담당하는 시설입니다.',
          cost: 35000,
          permitMinutes: 420,
        },
        {
          id: 'pier',
          code: 'PIER',
          name: '선착장',
          description: '소형 선박과 지역 운항을 위한 기본 접안 시설입니다.',
          cost: 6000,
          permitMinutes: 120,
        },
      ],
    },
    {
      id: 'space',
      name: '우주선',
      label: 'SPACE FACILITY',
      icon: '🚀',
      requiredResearch: 'facility-space-basic',
      available: false,
      unlocked: props.completedResearch.includes('facility-space-basic'),
      description: '우주항, 발사장, 궤도 터미널 같은 후반 확장 시설을 관리합니다.',
      facilities: [
        {
          id: 'spaceport',
          code: 'SPACEPORT',
          name: '우주항',
          description: '우주선 이착륙과 우주 교통 운항을 담당하는 후반 시설입니다.',
          cost: 200000,
          permitMinutes: 1440,
        },
        {
          id: 'launch-pad',
          code: 'LAUNCH',
          name: '발사장',
          description: '우주선 발사와 궤도 진입을 위한 특수 시설입니다.',
          cost: 150000,
          permitMinutes: 1080,
        },
      ],
    },
  ]
})

const selectedType = computed(() => {
  return transportTypes.value.find((type) => type.id === activeType.value) || transportTypes.value[0]
})

function selectType(typeId) {
  activeType.value = typeId
}
</script>

<style scoped>
.facility-page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-box {
  padding: 20px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.notice-box strong {
  display: block;
  color: #111827;
  font-size: 20px;
}

.notice-box p {
  max-width: 780px;
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}
</style>