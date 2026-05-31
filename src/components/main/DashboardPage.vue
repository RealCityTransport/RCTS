<!-- src/components/main/DashboardPage.vue -->
<template>
  <section class="dashboard-page">
    <BaseMainPage
      v-if="!hasCompany"
      eyebrow="RCTS DASHBOARD"
      title="회사를 만들어주세요."
      description="아직 생성된 회사가 없습니다. 회사를 만들면 사이트 메뉴가 열리고, 운행과 시설을 구성할 수 있습니다."
      badge="회사 없음"
    >
      <form class="company-form" @submit.prevent="submitCompany">
        <input
          v-model.trim="companyName"
          type="text"
          placeholder="회사명을 입력하세요"
          maxlength="24"
        />

        <button type="submit">
          회사 만들기
        </button>
      </form>
    </BaseMainPage>

    <BaseMainPage
      v-else
      eyebrow="COMPANY DASHBOARD"
      :title="company.name"
      description="회사 대시보드입니다. 이후 이곳에서 회사 정보, 운행 상태, 시설 상태, 연구 상태를 요약해서 볼 수 있습니다."
      badge="운영 준비중"
    >
      <section class="summary-grid">
        <article class="summary-card">
          <h3>회사 정보</h3>
          <p>{{ company.name }}</p>
        </article>

        <article class="summary-card">
          <h3>운행 요약</h3>
          <p>아직 등록된 노선과 운행 차량이 없습니다.</p>
        </article>

        <article class="summary-card">
          <h3>시설 요약</h3>
          <p>아직 개방된 시설 정보가 없습니다.</p>
        </article>
      </section>
    </BaseMainPage>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseMainPage from './BaseMainPage.vue'

const props = defineProps({
  company: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['create-company'])

const companyName = ref('')

const hasCompany = computed(() => {
  return Boolean(props.company)
})

function submitCompany() {
  if (!companyName.value) {
    return
  }

  emit('create-company', {
    name: companyName.value,
  })

  companyName.value = ''
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100%;
}

.company-form {
  width: min(100%, 460px);
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 10px;
}

.company-form input {
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
  outline: none;
}

.company-form input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.company-form button {
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: var(--blue);
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.company-form button:hover {
  filter: brightness(1.05);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.summary-card {
  min-height: 120px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.summary-card h3 {
  margin: 0;
  color: #111827;
  font-size: 16px;
}

.summary-card p {
  margin: 10px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .company-form {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>