<!-- src/components/TheFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="current-time">KST: {{ kstString }}</div>
    <div class="copyright">&copy; 2025 RealCityTransport Simulation</div>
    <div class="version">v0.1-alpha</div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// KST 시간 로직 (오빠의 아이디어를 적극 반영!)
const kstString = ref('');
let timer = null;

const pad2 = (num) => String(num).padStart(2, '0');

function formatKST(date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${Y}. ${M}. ${D}. ${hh}:${mm}`;
}

onMounted(() => {
  kstString.value = formatKST(new Date());
  timer = setInterval(() => {
    kstString.value = formatKST(new Date());
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer !== null) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1.5rem;
  background-color: #2c2c4d; /* 푸터 배경색 (헤더와 동일) */
  color: #aaa;
  font-size: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  .current-time {
    font-weight: bold;
    color: #88c0d0; /* KST 강조 색상 */
  }

  .copyright {
    opacity: 0.7;
  }
}
</style>