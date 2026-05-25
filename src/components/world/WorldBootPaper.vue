<!-- src/components/world/WorldBootPaper.vue -->
<template>
  <main class="boot-screen" :class="{ 'is-finished': isFinished }">
    <div class="paper-stage">
      <section class="paper">
        <p class="document-title">WORLD INITIALIZATION</p>

        <div class="content">
          <template v-for="item in visibleItems" :key="item.id">
            <p v-if="item.type === 'department'" class="department">
              {{ item.text }}
            </p>

            <p v-else-if="item.type === 'dialog'" class="dialog">
              {{ item.text }}
            </p>

            <p v-else-if="item.type === 'signature'" class="signature">
              {{ item.text }}
            </p>
          </template>
        </div>
      </section>
    </div>

    <section v-if="showView" class="eunwoo-view">
      <div class="view-inner">
        <div class="view-message">
          <p class="view-text">
            운영실 조명 확인 중<span class="dots"></span>
          </p>

          <transition name="slow-fade">
            <p v-if="showLocked" class="locked-text">
              잠겼네...
            </p>
          </transition>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const visibleItems = ref([])
const isFinished = ref(false)
const showView = ref(false)
const showLocked = ref(false)

const sequence = [
  { id: 1, type: 'department', text: '월드 행정국', delay: 900 },
  { id: 2, type: 'dialog', text: '...인사팀부터 필요하겠군.', delay: 2300 },
  { id: 3, type: 'department', text: '월드 인사팀', delay: 3600 },
  { id: 4, type: 'dialog', text: '서버 연결 상태를 확인해.', delay: 5200 },
  { id: 5, type: 'department', text: '서버 운영팀', delay: 6600 },
  { id: 6, type: 'dialog', text: '뉴스실은 아직 비어있군.', delay: 8400 },
  { id: 7, type: 'department', text: '뉴스팀', delay: 10000 },
  { id: 8, type: 'department', text: '데이터센터', delay: 11600 },
  { id: 9, type: 'signature', text: '- 차은우', delay: 13600 },
]

onMounted(() => {
  sequence.forEach((item) => {
    setTimeout(() => {
      visibleItems.value.push(item)
    }, item.delay)
  })

  setTimeout(() => {
    isFinished.value = true
  }, 15500)

  setTimeout(() => {
    showView.value = true
  }, 16800)

  // 운영실 화면 이후 늦게 출력
  setTimeout(() => {
    showLocked.value = true
  }, 22800)
})
</script>

<style scoped>
.boot-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.paper-stage {
  position: relative;
  z-index: 3;
  transition:
    transform 1.8s ease-in,
    opacity 1.2s ease-in,
    filter 1.2s ease-in;
}

.boot-screen.is-finished .paper-stage {
  transform: translate(-120vw, 70vh) rotate(-10deg) scale(0.5);
  opacity: 0;
  filter: brightness(0.35);
  pointer-events: none;
}

.paper {
  position: relative;
  width: min(430px, 84vw);
  min-height: 560px;
  padding: 38px 34px 46px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0)),
    #e1d7bf;
  color: #17130e;
  box-shadow:
    0 26px 90px rgba(255,255,255,0.06),
    0 0 0 1px rgba(0,0,0,0.18);
  font-family: "Noto Serif KR", "Batang", serif;
  transform: rotate(-0.35deg);
  animation: paperIn 0.9s ease-out both;
}

.document-title {
  margin: 0 0 36px;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: rgba(0,0,0,0.48);
}

.content {
  min-height: 430px;
}

.department {
  margin: 18px 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.18);
  font-size: 15px;
  letter-spacing: 0.06em;
  animation: writeIn 0.32s ease-out both;
}

.dialog {
  margin: 18px 0 4px;
  font-size: 13px;
  color: rgba(0,0,0,0.56);
  letter-spacing: 0.02em;
  animation: fadeIn 0.8s ease-out both;
}

.signature {
  position: absolute;
  right: 38px;
  bottom: 34px;
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.08em;
  color: rgba(25,20,16,0.72);
  animation: signatureIn 1.2s ease-out both;
}

.eunwoo-view {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: viewIn 2s ease-out both;
}

.view-inner {
  width: min(680px, 78vw);
  height: min(360px, 46vh);
  border: 1px solid rgba(255,255,255,0.08);
  background:
    radial-gradient(circle at 50% 38%, rgba(255,255,255,0.08), transparent 34%),
    linear-gradient(180deg, rgba(18,22,28,0.92), rgba(3,4,6,0.98));
  box-shadow: 0 0 120px rgba(255,255,255,0.05);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 34px;
}

.view-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.view-text {
  margin: 0;
  color: rgba(230,230,230,0.58);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.locked-text {
  margin: 0;
  color: rgba(255,255,255,0.28);
  font-size: 12px;
  letter-spacing: 0.14em;
}

.dots::after {
  content: "";
  animation: dots 3s steps(4, end) infinite;
}

.slow-fade-enter-active {
  transition:
    opacity 2.6s ease,
    transform 2.6s ease;
}

.slow-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.slow-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

@keyframes paperIn {
  from {
    opacity: 0;
    transform: translateY(10px) rotate(-0.35deg);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotate(-0.35deg);
  }
}

@keyframes writeIn {
  from {
    opacity: 0;
    transform: translateY(4px) translateX(-2px);
  }

  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes signatureIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes viewIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes dots {
  0% {
    content: "";
  }

  25% {
    content: ".";
  }

  50% {
    content: "..";
  }

  75% {
    content: "...";
  }

  100% {
    content: "";
  }
}
</style>