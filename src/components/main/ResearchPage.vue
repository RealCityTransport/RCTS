<!-- src/components/main/ResearchPage.vue -->
<template>
  <BaseMainPage
    eyebrow="RESEARCH"
    title="연구"
    description="연구를 완료하면 잠겨 있던 사이트 메뉴가 활성화됩니다. 현재는 초기 테스트 단계라 버튼을 누르면 즉시 연구가 완료됩니다."
    badge="메뉴 해금"
  >
    <section class="research-grid">
      <article
        v-for="research in researchItems"
        :key="research.id"
        class="research-card"
        :class="{ done: isResearchDone(research.id) }"
      >
        <div>
          <strong>{{ research.name }}</strong>
          <span>{{ research.description }}</span>
        </div>

        <button
          type="button"
          :disabled="isResearchDone(research.id)"
          @click="emit('complete-research', research.id)"
        >
          {{ isResearchDone(research.id) ? '완료됨' : '연구 완료' }}
        </button>
      </article>
    </section>
  </BaseMainPage>
</template>

<script setup>
import BaseMainPage from './BaseMainPage.vue'
import { researchItems } from '../../data/researchItems'

const props = defineProps({
  completedResearch: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['complete-research'])

function isResearchDone(researchId) {
  return props.completedResearch.includes(researchId)
}
</script>

<style scoped>
.research-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.research-card {
  display: grid;
  grid-template-columns: 1fr 104px;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.research-card.done {
  background: #eff6ff;
  border-color: #93c5fd;
}

.research-card strong {
  display: block;
  color: #111827;
  font-size: 15px;
}

.research-card span {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.research-card button {
  height: 38px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.research-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

@media (max-width: 820px) {
  .research-grid {
    grid-template-columns: 1fr;
  }

  .research-card {
    grid-template-columns: 1fr;
  }
}
</style>