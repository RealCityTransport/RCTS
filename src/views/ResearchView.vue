<!--
  파일 주소:
  src/views/ResearchView.vue

  적용 내용:
  - 연구 메뉴 페이지
  - 현재는 MenuPagePlaceholder를 사용한 임시 화면
  - 연구는 메뉴 해금보다 효율, 자동화, 수익 보정, 탑승률 개선 중심으로 사용

  연결된 파일:
  - src/router/index.js
  - src/components/common/MenuPagePlaceholder.vue

  향후 연결 예정:
  - src/components/research/ResearchList.vue
  - src/modules/research.js
  - src/modules/upgrade.js
-->

<template>
  <MenuPagePlaceholder
    kicker="RESEARCH"
    title="연구 / 업그레이드"
    description="RCTS v2의 연구는 메뉴를 잠그는 기능이 아니라, 운송 효율·자동화·정산 보정·탑승률·오프라인 처리 같은 편의와 성장 보정에 집중합니다."
    :items="items"
    :recommendations="recommendations"
  />
</template>

<script setup>
import MenuPagePlaceholder from '../components/common/MenuPagePlaceholder.vue'

const items = [
  {
    title: '해금 중심 아님',
    text: '기본 메뉴와 핵심 기능은 처음부터 보이게 하고, 연구는 효율 개선 역할을 맡습니다.',
    badge: '확정'
  },
  {
    title: '항공 탑승률 개선',
    text: '기본 탑승률 70%를 80%, 85%, 90%로 올리는 식의 보정 연구가 가능합니다.',
    badge: '예시'
  },
  {
    title: '슬롯 확장',
    text: '운송수단별 슬롯을 +10 단위로 늘리는 업그레이드가 연구/투자 항목이 될 수 있습니다.',
    badge: '중요'
  }
]

const recommendations = [
  '연구 데이터 구조 만들기',
  '완료 시간 카운터 만들기',
  '업그레이드 효과 적용 방식 정리',
  '슬롯 +10 확장 연구 만들기'
]
</script>