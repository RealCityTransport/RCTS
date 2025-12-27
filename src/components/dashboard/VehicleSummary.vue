<template>
  <div class="panel">
    <h3>차량 운행 상태</h3>

    <div class="line">
      운행 중 {{ running }} / {{ total }}대
    </div>

    <div class="line">
      정비 필요 {{ maintenance }}대
    </div>

    <div class="line">
      평균 회전시간 {{ avgTurn }}분
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const total = ref(42)
const running = ref(39)
const maintenance = ref(1)
const avgTurn = ref(42)
</script>

<style scoped>
.panel{
  background:#1b1b21;
  border:1px solid #2b2b33;
  border-radius:10px;
  padding:12px;
}

h3{
  margin:0 0 8px 0;
}

.line{
  margin:6px 0;
}
</style>
