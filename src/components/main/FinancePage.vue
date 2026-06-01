<!--
RCTS FILE CONTEXT
파일 역할:
- 재정 메뉴의 기본 껍데기 페이지.
- 재정은 게임머니, 수입, 지출, 예산, 운영 비용을 관리하는 영역이다.

현재 연결:
- Home.vue에서 activeMenu === 'finance'일 때 표시된다.
- BaseMainPage.vue를 사용해 메인 페이지 포맷을 통일한다.

현재 규칙:
- 재정 메뉴는 finance-basic 연구 완료 후 좌측 메뉴에서 클릭 가능해질 예정이다.
- 현재 finance-basic 연구는 미개발 상태라 일반 흐름에서는 아직 접근할 수 없다.
- 페이지는 향후 해금을 대비해 미리 준비한다.

주의:
- 재정은 해금 전에도 게임은 돌아갈 수 있다.
- 재정이 열리면 자금, 수입, 비용이 게임 진행에 강하게 영향을 준다.

다음 작업 방향:
- 게임머니 표시.
- 수익/비용 집계.
- 운임 설정.
- 예산 부족 효과.
- 재정 리포트.
-->

<template>
  <BaseMainPage
    eyebrow="FINANCE"
    title="재정"
    description="게임머니, 수입, 지출, 예산, 운영 비용을 관리하는 공간입니다. 재정이 열리면 자금 흐름이 게임 진행에 큰 영향을 줍니다."
    badge="미개발"
    tone="soft"
  >
    <section class="page-layout">
      <section class="warning-box">
        <strong>재정은 선택적 난이도 상승 영역입니다.</strong>
        <p>
          재정 메뉴가 열리기 전에도 기본 게임은 진행될 수 있습니다.
          하지만 재정이 해금되면 수익, 비용, 자금 부족, 예산 배정이 실제 운영에 영향을 주게 됩니다.
        </p>
      </section>

      <section class="feature-grid">
        <article class="feature-card">
          <span>MONEY</span>
          <strong>게임머니</strong>
          <p>현재 보유 자금과 운영 가능 예산을 표시합니다.</p>
        </article>

        <article class="feature-card">
          <span>INCOME</span>
          <strong>수입</strong>
          <p>운행 수익, 승객 수익, 보조금 같은 수입 흐름을 관리합니다.</p>
        </article>

        <article class="feature-card">
          <span>COST</span>
          <strong>비용</strong>
          <p>차량 유지비, 시설 유지비, 운행 비용, 인건비 같은 지출을 관리합니다.</p>
        </article>

        <article class="feature-card locked">
          <span>LATER</span>
          <strong>재정 리포트</strong>
          <p>일간/주간/월간 재정 흐름을 분석하는 기능은 이후 연결됩니다.</p>
        </article>
      </section>
    </section>
  </BaseMainPage>
</template>

<script setup>
import BaseMainPage from './BaseMainPage.vue'
</script>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.warning-box {
  padding: 20px;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  background: #fff7ed;
}

.warning-box strong {
  display: block;
  color: #111827;
  font-size: 20px;
}

.warning-box p {
  max-width: 820px;
  margin: 8px 0 0;
  color: #7c2d12;
  font-size: 15px;
  line-height: 1.7;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-card {
  min-height: 150px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.feature-card.locked {
  opacity: 0.62;
  filter: grayscale(0.3);
}

.feature-card span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.feature-card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 19px;
}

.feature-card p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>