<!-- src/components/main/CompanyPage.vue -->
<template>
  <BaseMainPage
    eyebrow="COMPANY"
    :title="companyName"
    description="이곳은 현재 운영 중인 회사 정보를 확인하는 메뉴입니다. 이후 회사 설정, 운영 성향, 보유 자산, 운영 기록 등이 이 화면에 연결됩니다."
    badge="회사 정보"
  >
    <section class="company-grid">
      <article class="info-card">
        <h3>회사 기본 정보</h3>

        <dl>
          <div>
            <dt>회사명</dt>
            <dd>{{ companyName }}</dd>
          </div>

          <div>
            <dt>회사 상태</dt>
            <dd>운영 준비중</dd>
          </div>

          <div>
            <dt>생성 시각</dt>
            <dd>{{ createdAtText }}</dd>
          </div>
        </dl>
      </article>

      <article class="info-card">
        <h3>운영 요약</h3>

        <dl>
          <div>
            <dt>운영 단계</dt>
            <dd>초기 단계</dd>
          </div>

          <div>
            <dt>등록 노선</dt>
            <dd>0개</dd>
          </div>

          <div>
            <dt>보유 차량</dt>
            <dd>0대</dd>
          </div>
        </dl>
      </article>

      <article class="info-card">
        <h3>개방 상태</h3>

        <dl>
          <div>
            <dt>대시보드</dt>
            <dd>개방됨</dd>
          </div>

          <div>
            <dt>회사 메뉴</dt>
            <dd>개방됨</dd>
          </div>

          <div>
            <dt>추가 기능</dt>
            <dd>연구 필요</dd>
          </div>
        </dl>
      </article>
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed } from 'vue'
import BaseMainPage from './BaseMainPage.vue'

const props = defineProps({
  company: {
    type: Object,
    default: null,
  },
})

const companyName = computed(() => {
  return props.company?.name || '회사 정보 없음'
})

const createdAtText = computed(() => {
  if (!props.company?.createdAt) {
    return '-'
  }

  const date = new Date(props.company.createdAt)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}년 ${month}월 ${day}일 ${hour}:${minute}`
})
</script>

<style scoped>
.company-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.info-card {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
  overflow: hidden;
}

.info-card h3 {
  margin: 0;
  padding: 12px 14px;
  color: #111827;
  font-size: 16px;
  border-bottom: 1px solid #dbe3ef;
  background: white;
}

.info-card dl {
  margin: 0;
  padding: 16px;
}

.info-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-card dl div:last-child {
  border-bottom: 0;
}

.info-card dt {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.info-card dd {
  margin: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  text-align: right;
}

@media (max-width: 820px) {
  .company-grid {
    grid-template-columns: 1fr;
  }
}
</style>