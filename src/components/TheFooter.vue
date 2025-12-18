<!-- src/components/TheFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="current-time">KST: {{ kstString }}</div>
    <div class="copyright">&copy; 2025 RealCityTransport Simulation</div>
    <div class="version">v0.1-alpha</div>
  </footer>
</template>

<script setup>
import { useKstTime } from '@/composables/useKstTime';

// KST 시간 표시 모듈
const { kstString } = useKstTime();
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