<template>
  <div class="summary-container">
    <div class="card" v-for="item in cards" :key="item.label">
      <div class="label">{{ item.label }}</div>
      <div class="value">{{ item.value }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cards = ref([
  { label:'총 차량', value:'42대' },
  { label:'노선 수', value:'12개' },
  { label:'일일 승객', value:'128,903명' },
  { label:'평균 탑승률', value:'73%' },
  { label:'연구 상태', value:'OFF' },
])
</script>

<style scoped>
.summary-container{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:8px;
}

.card{
  background:#1e1e24;
  border:1px solid #2d2d36;
  border-radius:8px;
  padding:12px;
}

.label{
  opacity:.7;
  font-size:.85rem;
  margin-bottom:4px;
}

.value{
  font-size:1.2rem;
  font-weight:600;
}
</style>
