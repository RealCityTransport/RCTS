<!--
  파일 주소:
  src/components/common/MenuPagePlaceholder.vue

  적용 내용:
  - 아직 실제 기능이 구현되지 않은 메뉴 페이지용 공통 임시 화면
  - 각 View.vue에서 title, kicker, description, items, recommendations를 전달받아 표시
  - 메뉴 클릭 시 페이지가 정상 로드되는지 확인하기 위한 공통 UI

  연결된 파일:
  - src/views/BusView.vue
  - src/views/RailView.vue
  - src/views/AirView.vue
  - src/views/ShipView.vue
  - src/views/SpaceView.vue
  - src/views/ResearchView.vue
  - src/views/SettingsView.vue

  수정 시 주의:
  - 실제 기능이 구현되면 각 View.vue에서 이 컴포넌트 사용을 제거하고 전용 레이아웃으로 교체 가능
-->

<template>
  <main class="page-layout">
    <section class="page-hero panel">
      <p>{{ kicker }}</p>
      <h1>{{ title }}</h1>
      <span>{{ description }}</span>
    </section>

    <section class="content-grid">
      <article class="panel main-panel">
        <div class="section-header">
          <h2>현재 적용 방향</h2>
          <span>임시 페이지</span>
        </div>

        <div class="item-list">
          <div
            v-for="item in items"
            :key="item.title"
            class="info-row"
          >
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.text }}</p>
            </div>
            <span>{{ item.badge }}</span>
          </div>
        </div>
      </article>

      <aside class="panel side-panel">
        <div class="section-header">
          <h2>다음 작업</h2>
          <span>TODO</span>
        </div>

        <ul class="todo-list">
          <li
            v-for="todo in recommendations"
            :key="todo"
          >
            {{ todo }}
          </li>
        </ul>
      </aside>
    </section>
  </main>
</template>

<script setup>
defineProps({
  kicker: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  recommendations: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.panel {
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 18px;
  background: rgba(8, 20, 34, 0.78);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
}

.page-hero {
  padding: 28px;
}

.page-hero p {
  margin: 0 0 8px;
  color: #4bcaff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.page-hero h1 {
  margin: 0 0 10px;
  font-size: 34px;
}

.page-hero span {
  color: #a8bacb;
  line-height: 1.6;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(720px, 1fr) 340px;
  gap: 16px;
}

.main-panel,
.side-panel {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
}

.section-header span {
  color: #7f92a4;
  font-size: 12px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.info-row strong {
  display: block;
}

.info-row p {
  margin: 5px 0 0;
  color: #90a4b7;
  line-height: 1.45;
}

.info-row span {
  align-self: flex-start;
  white-space: nowrap;
  padding: 5px 9px;
  color: #9fdcff;
  border-radius: 999px;
  background: rgba(80, 198, 255, 0.08);
  font-size: 12px;
  font-weight: 800;
}

.todo-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.todo-list li {
  padding: 12px 0;
  color: #b8c8d8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.todo-list li:last-child {
  border-bottom: 0;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>