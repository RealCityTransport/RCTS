<!-- src/pages/HomePage.vue -->

<script setup>
import { computed, ref } from 'vue'

const companyName = ref('')
const company = ref(null)

const canCreateCompany = computed(() => {
  return companyName.value.trim().length > 0 && !company.value
})

function createCompany() {
  if (!canCreateCompany.value) return

  company.value = {
    id: 'player-company',
    name: companyName.value.trim(),
  }
}
</script>

<template>
  <section class="home-page">
    <section v-if="!company" class="company-start-panel">
      <div class="start-title">
        <span class="panel-label">RCTS START</span>

        <h1>사장님 어떤 회사를 운영하실까요?</h1>

        <p>회사이름을 정해주세요.</p>
      </div>

      <div class="company-form">
        <label class="input-field">
          <span>회사명</span>
          <input
            v-model="companyName"
            type="text"
            placeholder="회사명을 입력하세요"
            @keyup.enter="createCompany"
          />
        </label>

        <button
          class="primary-button"
          type="button"
          :disabled="!canCreateCompany"
          @click="createCompany"
        >
          회사 설립
        </button>
      </div>
    </section>

    <section v-else class="company-created-panel">
      <h1 class="created-company-name">
        {{ company.name }}
      </h1>
    </section>
  </section>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 18px;
}

.company-start-panel {
  min-height: calc(100dvh - 120px);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 28px;
  padding: 32px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.18), transparent 48%),
    rgba(15, 23, 42, 0.62);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
  text-align: center;
}

.start-title {
  display: grid;
  gap: 10px;
}

.panel-label {
  color: #60a5fa;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.start-title h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 900;
  letter-spacing: -0.04em;
}

.start-title p {
  margin: 0;
  color: #cbd5e1;
  font-size: 18px;
  font-weight: 800;
}

.company-form {
  width: min(100%, 460px);
  display: grid;
  gap: 14px;
}

.input-field {
  display: grid;
  gap: 8px;
  text-align: left;
}

.input-field span {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
}

.input-field input {
  width: 100%;
  padding: 15px 16px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 16px;
  outline: none;
  background: rgba(15, 23, 42, 0.78);
  color: #f8fafc;
  font-size: 16px;
}

.input-field input::placeholder {
  color: #64748b;
}

.input-field input:focus {
  border-color: rgba(96, 165, 250, 0.7);
}

.primary-button {
  width: 100%;
  padding: 15px 16px;
  border: 0;
  border-radius: 16px;
  background: #60a5fa;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.primary-button:disabled {
  background: rgba(148, 163, 184, 0.22);
  color: #64748b;
  cursor: not-allowed;
}

.company-created-panel {
  min-height: calc(100dvh - 120px);
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.42);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
}

.created-company-name {
  margin: 0;
  color: #f8fafc;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

@media (max-width: 720px) {
  .company-start-panel,
  .company-created-panel {
    min-height: calc(100dvh - 96px);
    padding: 22px;
    border-radius: 22px;
  }

  .start-title h1 {
    font-size: 30px;
  }

  .start-title p {
    font-size: 16px;
  }

  .created-company-name {
    font-size: 26px;
  }
}
</style>