<!-- src/components/main/ComingSoonPage.vue -->
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