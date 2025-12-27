<template>
  <div class="panel">
    <h3>노선 요약</h3>

    <div class="route" v-for="r in routes" :key="r.name">
      <div class="name">{{ r.name }}</div>
      <div class="rate">{{ r.rate }}%</div>
      <div class="queue" :class="{ danger: r.queue>0 }">
        대기 {{ r.queue }}명
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const routes = ref([
  { name:'A 노선', rate:92, queue:231 },
  { name:'C 노선', rate:77, queue:0 },
  { name:'E 노선', rate:64, queue:0 },
])
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
  font-size:1rem;
}

.route{
  display:flex;
  justify-content:space-between;
  padding:8px 0;
  border-bottom:1px solid #2c2c33;
}

.route:last-child{
  border-bottom:none;
}

.queue.danger{
  color:#ff7070;
}
</style>
