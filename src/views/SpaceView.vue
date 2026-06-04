<!--
  파일 주소:
  src/views/SpaceView.vue

  적용 내용:
  - 우주선 메뉴 페이지
  - 현재는 MenuPagePlaceholder를 사용한 임시 화면
  - 우주선은 후반 콘텐츠로 준비중 상태
  - 기본 구조는 슬롯 1개 = 우주선 1대 원칙을 따름

  연결된 파일:
  - src/router/index.js
  - src/components/common/MenuPagePlaceholder.vue

  향후 연결 예정:
  - src/components/space/SpaceSlotList.vue
  - src/modules/space.js
  - src/modules/settlement.js
-->

<template>
  <MenuPagePlaceholder
    kicker="SPACE MODE"
    title="우주선 운영"
    description="우주선은 RCTS 후반 콘텐츠입니다. 현재는 준비중이며, 기본 원칙은 다른 운송수단과 동일하게 슬롯 1개 = 우주선 1대 구조로 갑니다."
    :items="items"
    :recommendations="recommendations"
  />
</template>

<script setup>
import MenuPagePlaceholder from '../components/common/MenuPagePlaceholder.vue'

const items = [
  {
    title: '후반 콘텐츠',
    text: '초기 개발에서는 구현하지 않고, 버스·항공·선박·철도 이후 확장합니다.',
    badge: '보류'
  },
  {
    title: '슬롯 구조',
    text: '우주선도 다른 교통수단과 동일하게 차량 중심 슬롯 구조를 따릅니다.',
    badge: '공통'
  },
  {
    title: '정산 방향',
    text: '화물, 승객, 계약, 탐사 보상 등으로 확장 가능하지만 현재는 세부 설계 보류입니다.',
    badge: '후반'
  }
]

const recommendations = [
  '현재는 메뉴 표시만 유지',
  '선박/항공 구조 안정화 후 재검토',
  '우주선 전용 정산 모델은 후반에 설계'
]
</script>