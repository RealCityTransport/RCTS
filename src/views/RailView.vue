<!--
  파일 주소:
  src/views/RailView.vue

  적용 내용:
  - 철도 메뉴 페이지
  - 현재는 MenuPagePlaceholder를 사용한 임시 화면
  - 철도는 열차 1편성 = 슬롯 1개 구조
  - 초기 철도는 사전 정의 노선, 정차 패턴, 출발시간, 구간별 속도제한 중심

  연결된 파일:
  - src/router/index.js
  - src/components/common/MenuPagePlaceholder.vue

  향후 연결 예정:
  - src/components/rail/RailSlotList.vue
  - src/modules/rail.js
  - src/modules/timetable.js
  - src/modules/settlement.js
-->

<template>
  <MenuPagePlaceholder
    kicker="RAIL MODE"
    title="철도 운영"
    description="철도는 열차 1편성이 시간표에 따라 어디로 이동하는지 보는 콘텐츠입니다. 복잡한 폐색과 신호는 후반으로 미루고, 초기에는 노선·정차역·속도제한·출발시간 중심으로 갑니다."
    :items="items"
    :recommendations="recommendations"
  />
</template>

<script setup>
import MenuPagePlaceholder from '../components/common/MenuPagePlaceholder.vue'

const items = [
  {
    title: '열차 1편성 = 슬롯 1개',
    text: '각 열차 슬롯은 출발시간, 현재 구간, 현재 속도, 남은 거리, 다음 정차역을 가집니다.',
    badge: '확정'
  },
  {
    title: '정차 패턴',
    text: '같은 서울-부산 노선이라도 KTX 001, KTX 011처럼 정차역이 다를 수 있습니다.',
    badge: '시간표'
  },
  {
    title: '정산 방식',
    text: '역마다 승하차가 발생하는 버스/철도형 Flow Settlement를 사용합니다.',
    badge: 'Flow'
  }
]

const recommendations = [
  '서울-부산 기본 노선 데이터 만들기',
  '역간 거리와 속도제한 데이터 만들기',
  '정차 패턴 선택 UI 만들기',
  '출발시간 기반 운행 시작 처리하기'
]
</script>