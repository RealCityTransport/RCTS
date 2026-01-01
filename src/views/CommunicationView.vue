<!-- src/views/CommunicationView.vue -->
<template>
  <div class="comm-root">
    <header class="comm-header">
      <p class="comm-badge">Tools · Async Communication</p>
      <h2 class="comm-title">비동기 커뮤니케이션</h2>
      <p class="comm-desc">
        개발 로그와는 별도로, 이슈·질문·아이디어를 비동기적으로 주고받는
        토론용 워크스페이스입니다. 모드 단위 구독을 전제로 설계합니다.
      </p>
    </header>

    <section class="comm-layout">
      <section class="comm-panel">
        <h3 class="panel-title">구독 중인 모드</h3>
        <p class="panel-desc">
          나중에는 여기에서 내가 구독한 모드 목록이 표시되고,
          선택한 모드와 관련된 대화 스레드만 필터링해서 볼 수 있게 됩니다.
        </p>
        <ul class="placeholder-list">
          <li>예: 도심 버스팩 v1.2</li>
          <li>예: 코어 규칙 세트</li>
          <li>예: 스타트 시나리오 · 메트로 시티</li>
        </ul>
      </section>

      <section class="comm-panel">
        <h3 class="panel-title">스레드 리스트</h3>
        <p class="panel-desc">
          이슈, 질문, 아이디어 등을 스레드 단위로 관리합니다.<br />
          각 스레드는 하나 이상의 모드와 연결되고, 모드별로 모아보기가 가능합니다.
        </p>
        <p class="panel-foot">
          추후: 태그(이슈/질문/아이디어), 상태(열림/해결), 모드 필터 추가
        </p>
      </section>

      <section class="comm-panel">
        <h3 class="panel-title">선택된 스레드</h3>
        <p class="panel-desc">
          오른쪽 영역에는 선택된 스레드의 본문과 댓글(비동기 대화)이 표시됩니다.<br />
          여기서 바로 해당 모드를 구독하거나, 모딩 에디터로 넘어갈 수 있도록 설계할 예정입니다.
        </p>
        <p class="panel-foot">
          추후: “모딩 에디터에서 열기”, “이 모드 구독/구독 해제” 액션 배치
        </p>
      </section>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.comm-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comm-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comm-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.7rem;
  opacity: 0.9;
}

.comm-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.comm-desc {
  font-size: 0.84rem;
  opacity: 0.95;
  line-height: 1.6;
}

.comm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.comm-panel {
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.9);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.panel-desc {
  font-size: 0.8rem;
  opacity: 0.95;
  line-height: 1.6;
}

.panel-foot {
  margin-top: 4px;
  font-size: 0.75rem;
  opacity: 0.8;
}

.placeholder-list {
  margin-top: 4px;
  padding-left: 16px;
  font-size: 0.78rem;
  opacity: 0.9;
}

/* 넓은 화면에서 3열 */
@media (min-width: 1024px) {
  .comm-layout {
    grid-template-columns: minmax(0, 26%) minmax(0, 34%) minmax(0, 40%);
  }
}
</style>
