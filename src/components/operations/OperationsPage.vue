<!-- src/components/operations/OperationsPage.vue -->
<template>
  <div class="operations-root">
    <!-- 상단: 메뉴만 표시 -->
    <header class="operations-header">
      <nav class="operations-body-menu">
        <button
          type="button"
          class="operations-body-menu-item"
          :class="{ 'is-active': activeSection === 'operations' }"
          @click="activeSection = 'operations'"
        >
          운영
        </button>
        <button
          type="button"
          class="operations-body-menu-item"
          :class="{ 'is-active': activeSection === 'routes' }"
          @click="activeSection = 'routes'"
        >
          노선
        </button>
        <button
          type="button"
          class="operations-body-menu-item"
          :class="{ 'is-active': activeSection === 'vehicles' }"
          @click="activeSection = 'vehicles'"
        >
          차량
        </button>
      </nav>
    </header>

    <!-- 본문 -->
    <main class="operations-body">
      <!-- 섹션: 운영 영역 -->
      <section
        v-if="activeSection === 'operations'"
        class="operations-section"
      >
        <section class="operations-panel operations-panel-main">
          <h4 class="panel-title">전체 운영 현황</h4>
          <p class="panel-desc">
            현재 세계에서 진행 중인 운행 상황을 한눈에 보여주는 영역입니다.
            실제 서비스에서는 시간대별 운행량, 지연 현황, 주요 알림 등이
            이 자리에서 실시간으로 갱신됩니다.
          </p>

          <div class="panel-grid">
            <article class="panel-card">
              <h5 class="panel-card-title">운행 상태 요약</h5>
              <p class="panel-card-text">
                정상 운행, 지연, 운휴 비율을 간단한 지표로 표시합니다.
                향후에는 그래프와 색상 인디케이터를 통해
                현재 상황을 직관적으로 확인할 수 있도록 확장됩니다.
              </p>
            </article>
            <article class="panel-card">
              <h5 class="panel-card-title">시간대별 운행 흐름</h5>
              <p class="panel-card-text">
                출근·퇴근 피크 시간과 심야 시간대별 운행 밀도를
                타임라인 또는 차트 형태로 보여주는 영역입니다.
                운영 전략을 세울 때 기준이 되는 핵심 정보입니다.
              </p>
            </article>
            <article class="panel-card">
              <h5 class="panel-card-title">운영 알림 & 이벤트</h5>
              <p class="panel-card-text">
                지연, 사고, 공사, 임시 운휴 등 운영에 영향을 주는 이벤트를
                시간 순으로 정리해 보여줍니다.
                중요한 알림은 별도 강조 표시로 시선을 끌게 됩니다.
              </p>
            </article>
          </div>
        </section>

        <section class="operations-panel operations-panel-sub">
          <div class="sub-grid">
            <article class="sub-card">
              <h4 class="sub-card-title">노선 운영 요약</h4>
              <p class="sub-card-text">
                주요 노선의 혼잡도, 지연 여부, 운행 간격 등을
                간단히 확인할 수 있는 요약 영역입니다.
                실제 구현 시에는 노선 모듈을 그대로 불러와,
                상위 몇 개 핵심 노선을 빠르게 살펴볼 수 있도록 구성됩니다.
              </p>
            </article>

            <article class="sub-card">
              <h4 class="sub-card-title">차량 운용 요약</h4>
              <p class="sub-card-text">
                차량 가동률, 정비 대기 차량 수, 예비 차량 상태 등을
                간략하게 보여주는 카드입니다.
                차량 모듈과 연결되어, 자세한 정보로 바로 이동할 수 있도록
                링크와 버튼이 추가될 예정입니다.
              </p>
            </article>
          </div>
        </section>
      </section>

      <!-- 섹션: 노선 영역 -->
      <section
        v-else-if="activeSection === 'routes'"
        class="operations-section"
      >
        <section class="operations-panel operations-panel-main">
          <header class="operations-routes-header">
            <div class="operations-routes-main">
              <h4 class="panel-title">노선 운영 현황</h4>
              <p class="panel-desc">
                이 화면은 노선을 운영 관점에서 정리해서 보여주는 영역입니다.
                노선 목록과 정류장·역 구조를
                하위 탭으로 나누어, 노선 편집 영역과 동일한 모듈을
                운영 센터에서도 그대로 재사용할 수 있게 구성합니다.
              </p>
            </div>

            <!-- 노선 운영 하위 메뉴 -->
            <nav class="operations-routes-nav">
              <button
                type="button"
                class="operations-routes-nav-item"
                :class="{ 'is-active': activeRoutesTab === 'lines' }"
                @click="activeRoutesTab = 'lines'"
              >
                노선 목록
              </button>
              <button
                type="button"
                class="operations-routes-nav-item"
                :class="{ 'is-active': activeRoutesTab === 'stops' }"
                @click="activeRoutesTab = 'stops'"
              >
                정류장 · 역
              </button>
            </nav>
          </header>

          <!-- 하위 탭 본문: routes 영역 탭 컨포넌트 그대로 재사용 -->
          <section class="operations-routes-body">
            <RoutesLinesTab
              v-if="activeRoutesTab === 'lines'"
            />
            <RoutesStopsEditorTab
              v-else-if="activeRoutesTab === 'stops'"
            />
          </section>
        </section>

        <section class="operations-panel operations-panel-sub">
          <div class="sub-grid">
            <article class="sub-card">
              <h4 class="sub-card-title">운영 관점에서의 활용 팁</h4>
              <p class="sub-card-text">
                노선 운영 탭에서는 편집 화면과 동일한 모듈을 사용하지만,
                실제로는 지연·혼잡·이벤트 정보와 결합해
                운영 중 즉석에서 노선을 조정하는 용도로 활용하게 됩니다.
              </p>
            </article>

            <article class="sub-card">
              <h4 class="sub-card-title">향후 연동 계획</h4>
              <p class="sub-card-text">
                이후에는 운영 알림, 수요 분석, 관제 화면과 연동해,
                이 탭에서 선택한 노선의 상태를
                관제 UI와 함께 동시에 확인할 수 있도록 확장할 예정입니다.
              </p>
            </article>
          </div>
        </section>
      </section>

      <!-- 섹션: 차량 영역 -->
      <section
        v-else-if="activeSection === 'vehicles'"
        class="operations-section"
      >
        <section class="operations-panel operations-panel-main">
          <header class="operations-vehicles-header">
            <div class="operations-vehicles-main">
              <h4 class="panel-title">차량 운영 현황</h4>
              <p class="panel-desc">
                이 화면은 차량을 운영 관점에서 정리해서 보여주는 영역입니다.
                차량 현황 요약과 차량 목록을 하위 탭으로 나누어,
                차량 관리 페이지에서 사용하는 모듈을
                운영 센터에서도 그대로 재사용할 수 있게 구성합니다.
              </p>
            </div>

            <!-- 차량 운영 하위 메뉴 -->
            <nav class="operations-vehicles-nav">
              <button
                type="button"
                class="operations-vehicles-nav-item"
                :class="{ 'is-active': activeVehiclesTab === 'overview' }"
                @click="activeVehiclesTab = 'overview'"
              >
                차량 현황
              </button>
              <button
                type="button"
                class="operations-vehicles-nav-item"
                :class="{ 'is-active': activeVehiclesTab === 'list' }"
                @click="activeVehiclesTab = 'list'"
              >
                차량 목록
              </button>
            </nav>
          </header>

          <!-- 하위 탭 본문: vehicles 탭 컨포넌트 재사용 -->
          <section class="operations-vehicles-body">
            <VehiclesOverviewTab
              v-if="activeVehiclesTab === 'overview'"
            />
            <VehiclesListTab
              v-else-if="activeVehiclesTab === 'list'"
            />
          </section>
        </section>

        <section class="operations-panel operations-panel-sub">
          <div class="sub-grid">
            <article class="sub-card">
              <h4 class="sub-card-title">운영 관점에서의 활용 팁</h4>
              <p class="sub-card-text">
                차량 운영 탭에서는 차량 관리 화면과 동일한 모듈을 사용하지만,
                실제로는 지연·정비·배차 정보와 결합해
                운영 중 즉석에서 차량을 재배치하는 용도로 활용하게 됩니다.
              </p>
            </article>

            <article class="sub-card">
              <h4 class="sub-card-title">차량 상세 화면으로 이동</h4>
              <p class="sub-card-text">
                차량 목록 탭에서 선택한 차량에 대해,
                별도의 상세 화면에서 운행 이력과 정비 기록을
                함께 확인할 수 있도록 연동하는 입구 역할을 합니다.
              </p>
            </article>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import RoutesLinesTab from '@/components/routes/RoutesListTab.vue'
import RoutesStopsEditorTab from '@/components/routes/RoutesStopsEditorTab.vue'

import VehiclesOverviewTab from '@/components/vehicles/VehiclesOverviewTab.vue'
import VehiclesListTab from '@/components/vehicles/VehiclesListTab.vue'

type OperationsSection = 'operations' | 'routes' | 'vehicles'
type RoutesOpsTab = 'lines' | 'stops'
type VehiclesOpsTab = 'overview' | 'list'

const activeSection = ref<OperationsSection>('operations')
const activeRoutesTab = ref<RoutesOpsTab>('lines')
const activeVehiclesTab = ref<VehiclesOpsTab>('overview')
</script>

<style scoped>
.operations-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더: 이제 메뉴만 감싸는 영역 */

.operations-header {
  display: flex;
  flex-direction: column;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

/* 본문 */

.operations-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 본문 상단 메뉴 (운영 / 노선 / 차량) */

.operations-body-menu {
  display: inline-flex;
  gap: 6px;
  padding: 4px 0;
}

.operations-body-menu-item {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 0.8rem;
  cursor: pointer;
  color: #e5e7eb;
  opacity: 0.9;
  transition:
    background 0.12s ease-out,
    border-color 0.12s ease-out,
    opacity 0.12s ease-out;
}

.operations-body-menu-item:hover {
  opacity: 1;
  border-color: rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.9);
}

.operations-body-menu-item.is-active {
  opacity: 1;
  border-color: rgba(129, 140, 248, 0.95);
  background: rgba(30, 64, 175, 0.9);
}

/* 섹션 공통 */

.operations-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 패널 공통 */

.operations-panel {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
}

/* 메인 패널 */

.operations-panel-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.panel-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

.panel-grid {
  margin-top: 4px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.panel-card {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.panel-card-title {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-card-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 서브 패널 (노선 / 차량 미리보기) */

.operations-panel-sub {
  display: flex;
  flex-direction: column;
}

.sub-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.sub-card {
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.sub-card-title {
  font-size: 0.84rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.sub-card-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

.sub-hint-list {
  margin: 4px 0 0;
  padding-left: 16px;
  font-size: 0.76rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 노선 운영 하위 탭 헤더 */

.operations-routes-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.operations-routes-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 노선 운영 하위 탭 메뉴 */

.operations-routes-nav {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.operations-routes-nav-item {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.78rem;
  cursor: pointer;
  color: #e5e7eb;
  transition:
    background 0.15s ease-out,
    border-color 0.15s ease-out,
    transform 0.05s ease-out;
}

.operations-routes-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: rgba(30, 64, 175, 0.9);
}

.operations-routes-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  transform: translateY(-1px);
}

/* 노선 운영 하위 탭 본문 래퍼 */

.operations-routes-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 차량 운영 하위 탭 헤더 */

.operations-vehicles-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.operations-vehicles-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 차량 운영 하위 탭 메뉴 */

.operations-vehicles-nav {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.operations-vehicles-nav-item {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.78rem;
  cursor: pointer;
  color: #e5e7eb;
  transition:
    background 0.15s ease-out,
    border-color 0.15s ease-out,
    transform 0.05s ease-out;
}

.operations-vehicles-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: rgba(30, 64, 175, 0.9);
}

.operations-vehicles-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  transform: translateY(-1px);
}

/* 차량 운영 하위 탭 본문 래퍼 */

.operations-vehicles-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 반응형 */

@media (min-width: 1040px) {
  .panel-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
