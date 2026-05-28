<template>
  <section class="page-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>

      <div class="stage-card">
        <span>현재 단계</span>
        <strong>{{ stage }}</strong>
      </div>
    </header>

    <slot />
  </section>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: 'RCTS',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    default: '0단계',
  },
})
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: stretch;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.66);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
}

.eyebrow {
  margin: 0 0 8px;
  color: #93c5fd;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 10px;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.05;
}

p {
  max-width: 780px;
  margin: 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.stage-card {
  min-width: 170px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.22);
  display: grid;
  align-content: center;
  gap: 6px;
}

.stage-card span {
  color: #94a3b8;
  font-size: 13px;
}

.stage-card strong {
  font-size: 22px;
}

@media (max-width: 720px) {
  .page-header {
    display: grid;
  }
}
</style>