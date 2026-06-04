<!--
  파일 주소:
  src/views/AirView.vue

  적용 내용:
  - 항공 메뉴 페이지
  - 현재는 MenuPagePlaceholder를 사용한 임시 화면
  - 항공은 항공기 1대 = 슬롯 1개 구조
  - 항공 절차 상태와 장시간 비행 카운터 중심

  연결된 파일:
  - src/router/index.js
  - src/components/common/MenuPagePlaceholder.vue

  향후 연결 예정:
  - src/components/air/AircraftSlotList.vue
  - src/modules/air.js
  - src/modules/offlineProgress.js
  - src/modules/settlement.js
-->

<template>
  <MenuPagePlaceholder
    kicker="AIR MODE"
    title="항공 운영"
    description="항공은 비싼 항공기를 긴 비행에 투입하고, BOARDING부터 CRUISE, LANDING, SETTLEMENT까지 절차 상태가 바뀌는 것을 보는 콘텐츠입니다."
    :items="items"
    :recommendations="recommendations"
  />
</template>

<script setup>
import MenuPagePlaceholder from '../components/common/MenuPagePlaceholder.vue'

const items = [
  {
    title: '항공기 1대 = 슬롯 1개',
    text: '항공기마다 출발지, 도착지, 항공 절차 상태, 남은 거리, 남은 시간을 가집니다.',
    badge: '확정'
  },
  {
    title: '탑승률 보정',
    text: '기본 탑승률 70%, 남은 30%는 10% 확률로 만석 처리합니다. 업그레이드 후 80% 이상으로 개선됩니다.',
    badge: '업글'
  },
  {
    title: '정산 방식',
    text: '출발 전 탑승량을 확정하고 장시간 비행 후 도착 정산하는 Trip Settlement를 사용합니다.',
    badge: 'Trip'
  }
]

const recommendations = [
  '항공 상태 단계 데이터 만들기',
  '탑승률 계산 함수 만들기',
  '실시간/오프라인 진행률 계산 만들기',
  '도착 정산 처리 연결하기'
]
</script>