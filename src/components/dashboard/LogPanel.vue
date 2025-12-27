<template>
  <div class="log">
    <h3>도시 로그</h3>

    <div class="item" v-for="l in logs" :key="l.time">
      <span class="time">{{ l.time }}</span>
      <span>{{ l.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logs = ref([
  { time:'21:12', text:'XX역 관광객 급증 발생' },
  { time:'21:26', text:'A노선 대기열 800명 돌파' },
  { time:'21:40', text:'차량 #24 정비 필요' },
])
</script>

<style scoped>
.log{
  background:#14141a;
  border:1px solid #24242c;
  border-radius:10px;
  padding:12px;
}

.item{
  margin:6px 0;
  font-size:.9rem;
  opacity:.9;
}

.time{
  opacity:.6;
  margin-right:6px;
}
</style>
