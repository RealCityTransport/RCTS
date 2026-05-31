<!-- src/components/header/HeaderNews.vue -->
<template>
  <section class="news-bar">
    <strong>RCTS NEWS</strong>

    <div class="news-content">
      <span v-for="news in newsItems" :key="news">
        {{ news }}
      </span>
    </div>
  </section>
</template>

<script setup>
defineProps({
  newsItems: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.news-bar {
  height: 38px;
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  background: var(--news-bg, #0f172a);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.news-bar > strong {
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--news-label-bg, #2563eb);
  color: white;
  font-size: 13px;
  letter-spacing: 1px;
}

.news-content {
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
}

.news-content span {
  color: #dbeafe;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 820px) {
  .news-bar {
    height: 40px;
    grid-template-columns: 112px 1fr;
  }

  .news-bar > strong {
    font-size: 12px;
  }

  .news-content {
    padding: 0 14px;
  }

  .news-content span {
    font-size: 13px;
  }
}
</style>