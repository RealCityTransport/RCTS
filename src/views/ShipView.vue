<!--
  파일 주소:
  src/views/ShipView.vue

  적용 내용:
  - 선박 메뉴 페이지
  - 현재는 MenuPagePlaceholder를 사용한 임시 화면
  - 선박은 선박 1척 = 슬롯 1개 구조
  - 장기 항해와 대형 정산 중심

  연결된 파일:
  - src/router/index.js
  - src/components/common/MenuPagePlaceholder.vue

  향후 연결 예정:
  - src/components/ship/ShipSlotList.vue
  - src/components/ship/CruiseSlotList.vue
  - src/modules/ship.js
  - src/modules/cruise.js
  - src/modules/settlement.js
-->

<template>
  <MenuPagePlaceholder
    kicker="SHIP MODE"
    title="선박 운영"
    description="선박은 비싸게 구매한 뒤 장기 항로에 투입하고, 며칠에서 몇 주 뒤 큰 정산을 받는 장기 보험형 콘텐츠입니다. 크루즈는 기항지와 구간별 승객 정산이 추가됩니다."
    :items="items"
    :recommendations="recommendations"
  />
</template>

<script setup>
import MenuPagePlaceholder from '../components/common/MenuPagePlaceholder.vue'

const items = [
  {
    title: '선박 1척 = 슬롯 1개',
    text: '화물선, 크루즈선 모두 선박 1척이 하나의 운행 슬롯으로 처리됩니다.',
    badge: '확정'
  },
  {
    title: '화물선 정산',
    text: '출항 전 계약/화물량을 확정하고 도착 항구에서 대형 정산을 처리합니다.',
    badge: 'Trip'
  },
  {
    title: '크루즈 정산',
    text: '출항 전 티켓 수익, 기항지 승하선, 선내 소비, 관광 수익을 혼합형으로 처리합니다.',
    badge: 'Mixed'
  }
]

const recommendations = [
  '기본 화물선 슬롯 화면 만들기',
  '항로 기간/남은 시간 계산 만들기',
  '장기 오프라인 진행 처리하기',
  '크루즈 기항지 정산 구조 분리하기'
]
</script>