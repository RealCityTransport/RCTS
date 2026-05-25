<template>
  <main class="world-waiting">
    <p class="waiting-text">
      월드 대표자 기다리는 중<span class="dots"></span>
    </p>
  </main>
</template>

<script setup>
</script>

<style scoped>
.world-waiting {
  width: 100%;
  height: 100vh;
  background: #000;
  color: rgba(230, 230, 230, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.waiting-text {
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.08em;
  user-select: none;
  animation: softBlink 4s ease-in-out infinite;
}

.dots::after {
  content: "";
  animation: dots 3s steps(4, end) infinite;
}

@keyframes softBlink {
  0% { opacity: 0.28; }
  50% { opacity: 0.86; }
  100% { opacity: 0.28; }
}

@keyframes dots {
  0% { content: ""; }
  25% { content: "."; }
  50% { content: ".."; }
  75% { content: "..."; }
  100% { content: ""; }
}
</style>