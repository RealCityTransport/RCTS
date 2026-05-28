<template>
  <article class="coming-card">
    <div>
      <span class="tag">{{ tag }}</span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <strong class="soon">곧 오픈 예정</strong>
  </article>
</template>

<script setup>
defineProps({
  tag: {
    type: String,
    default: '기능',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '현재는 메뉴 구조만 준비되어 있으며, 실제 기능은 이후 단계에서 연결됩니다.',
  },
})
</script>

<style scoped>
.coming-card {
  min-height: 150px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.68);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.tag {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 900;
}

h3 {
  margin: 0 0 8px;
  font-size: 21px;
}

p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.55;
  font-size: 14px;
}

.soon {
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.16);
  color: #fcd34d;
  font-size: 13px;
}
</style>