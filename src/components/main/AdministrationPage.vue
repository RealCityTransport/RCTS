<!--
RCTS FILE CONTEXT
파일 역할:
- 행정 메뉴의 기본 껍데기 페이지.
- 행정은 인허가, 승인 절차, 시설 설치 허가, 노선 허가를 관리하는 영역이다.

현재 연결:
- Home.vue에서 activeMenu === 'administration'일 때 표시된다.
- BaseMainPage.vue를 사용해 메인 페이지 포맷을 통일한다.

현재 규칙:
- 행정 메뉴는 administration-basic 연구 완료 후 좌측 메뉴에서 클릭 가능해질 예정이다.
- 현재 administration-basic 연구는 미개발 상태라 일반 흐름에서는 아직 접근할 수 없다.
- 페이지는 향후 해금을 대비해 미리 준비한다.

주의:
- 행정은 해금하지 않아도 초기 게임은 진행될 수 있다.
- 행정이 열리면 시설 설치, 노선 허가 등에 일정 시간의 인허가 절차가 붙어 난이도가 올라간다.

다음 작업 방향:
- 시설 설치 허가.
- 노선 허가.
- 운행 승인.
- 행정 처리 시간.
- 허가 대기 목록.
-->

<template>
  <BaseMainPage
    eyebrow="ADMINISTRATION"
    title="행정"
    description="시설 설치, 노선 허가, 운행 승인 같은 인허가 절차를 관리하는 공간입니다. 해금 후에는 운영 난이도가 올라갑니다."
    badge="미개발"
    tone="soft"
  >
    <section class="page-layout">
      <section class="warning-box">
        <strong>행정은 현실성 확장과 난이도 상승 영역입니다.</strong>
        <p>
          행정 메뉴가 열리면 시설을 설치하거나 노선을 만들 때 허가 절차와 처리 시간이 필요해집니다.
          초반에는 단순하게 진행하고, 이후 고급 운영 단계에서 해금되는 구조가 좋습니다.
        </p>
      </section>

      <section class="feature-grid">
        <article class="feature-card">
          <span>PERMIT</span>
          <strong>시설 설치 허가</strong>
          <p>역, 정류장, 터미널 등 시설 설치 전 승인 절차를 관리합니다.</p>
        </article>

        <article class="feature-card">
          <span>ROUTE</span>
          <strong>노선 허가</strong>
          <p>새 노선 개설, 변경, 폐지에 필요한 승인 절차를 관리합니다.</p>
        </article>

        <article class="feature-card">
          <span>TIME</span>
          <strong>처리 시간</strong>
          <p>인허가 신청 후 승인까지 걸리는 대기 시간을 관리합니다.</p>
        </article>

        <article class="feature-card locked">
          <span>LATER</span>
          <strong>행정 리스크</strong>
          <p>민원, 제한 조건, 지연, 승인 실패 같은 요소는 이후 고급 기능으로 확장됩니다.</p>
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
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff7f7;
}

.warning-box strong {
  display: block;
  color: #111827;
  font-size: 20px;
}

.warning-box p {
  max-width: 820px;
  margin: 8px 0 0;
  color: #7f1d1d;
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