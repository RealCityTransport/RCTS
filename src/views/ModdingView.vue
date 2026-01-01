<!-- src/views/ModdingView.vue -->
<template>
  <div class="modding-root">
    <header class="modding-header">
      <p class="modding-badge">Tools · Modding Workspace</p>
      <h2 class="modding-title">모딩 에디터</h2>
      <p class="modding-desc">
        차량 세트, 규칙 세트, 맵 프리셋 등 RCTS 세계를 확장하는
        각종 모드를 설계·편집하는 워크스페이스입니다.
      </p>
    </header>

    <section class="modding-grid">
      <section class="modding-card">
        <h3 class="card-title">차량 모딩</h3>
        <p class="card-desc">
          버스, 철도, 항공, 해상, 우주선 등 각 차량 타입별로
          기본 스펙과 그래픽, 운행 특성 값을 설정하는 에디터를 둘 예정입니다.
        </p>
        <p class="card-foot">추후: 차량 세트 불러오기 / 저장 / 공유</p>
      </section>

      <section class="modding-card">
        <h3 class="card-title">규칙·밸런스 모딩</h3>
        <p class="card-desc">
          수요, 수익, 유지비, 사고 확률 등 게임 내 경제·운행 규칙을
          별도 세트로 정의하고 불러오는 구조를 목표로 합니다.
        </p>
        <p class="card-foot">추후: 규칙 프리셋, 난이도 커스텀</p>
      </section>

      <section class="modding-card">
        <h3 class="card-title">맵·시나리오 모딩</h3>
        <p class="card-desc">
          초기 도시 구성, 시작 자본, 개방된 운송수단 등을
          시나리오 단위로 저장하는 기능을 이 영역에 모아둘 계획입니다.
        </p>
        <p class="card-foot">추후: 시나리오 공유 / 챌린지 모드</p>
      </section>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.modding-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modding-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modding-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.7rem;
  opacity: 0.9;
}

.modding-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.modding-desc {
  font-size: 0.84rem;
  opacity: 0.95;
  line-height: 1.6;
}

.modding-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.modding-card {
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.9);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.card-desc {
  font-size: 0.8rem;
  opacity: 0.95;
  line-height: 1.6;
}

.card-foot {
  margin-top: 4px;
  font-size: 0.75rem;
  opacity: 0.8;
}

/* 넓은 화면에서 3열 */
@media (min-width: 1024px) {
  .modding-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
