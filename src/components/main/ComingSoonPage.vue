<!-- src/components/main/ComingSoonPage.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 아직 실제 기능이 연결되지 않은 메뉴의 준비중 화면을 담당한다.
- 메뉴별 준비중 화면 포맷을 통일하기 위해 만든 컴포넌트.

현재 연결:
- Home.vue에서 Dashboard/Company/Research 외 메뉴 선택 시 표시된다.
- menuName props를 받아 해당 메뉴 이름을 화면에 표시한다.
- BaseMainPage.vue를 사용해 메인 페이지 포맷을 유지한다.

주의:
- 임시 페이지이므로 실제 기능 페이지가 만들어지면 Home.vue에서 해당 컴포넌트로 교체한다.

다음 작업 방향:
- 잠금 사유, 필요한 연구, 예상 기능 설명 등을 표시하도록 확장할 수 있다.
-->

<template>
  <BaseMainPage
    eyebrow="COMING SOON"
    :title="`${menuName} 화면 준비중입니다.`"
    :description="description"
    badge="준비중"
    tone="soft"
  >
    <section class="empty-box">
      <strong>{{ menuName }}</strong>
      <p>
        현재는 초기 레이아웃 구성 단계입니다.
        이후 이 영역에 선택한 메뉴의 실제 기능 화면이 표시됩니다.
      </p>
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed } from 'vue'
import BaseMainPage from './BaseMainPage.vue'

const props = defineProps({
  menuName: {
    type: String,
    required: true,
  },
})

const description = computed(() => {
  return `${props.menuName} 메뉴는 아직 실제 기능이 연결되지 않았습니다.`
})
</script>

<style scoped>
.empty-box {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
}

.empty-box strong {
  color: #111827;
  font-size: 24px;
}

.empty-box p {
  max-width: 680px;
  margin: 10px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}
</style>