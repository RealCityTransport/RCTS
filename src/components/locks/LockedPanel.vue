<template>
  <section class="locked-panel" :class="{ 'is-compact': compact }">
    <header class="locked-head">
      <div class="locked-badge">LOCKED</div>
      <div class="locked-title-wrap">
        <h2 class="locked-title">{{ title }}</h2>
        <p class="locked-subtitle" v-if="subtitle">{{ subtitle }}</p>
      </div>
    </header>

    <div class="locked-body">
      <div class="locked-message">
        <p class="locked-primary">{{ message }}</p>
        <ul class="locked-list" v-if="hints?.length">
          <li v-for="(h, i) in hints" :key="i">{{ h }}</li>
        </ul>
      </div>

      <div class="locked-preview">
        <div class="preview-grid">
          <div class="preview-card" v-for="n in previewCards" :key="n">
            <div class="preview-top">
              <div class="preview-dot"></div>
              <div class="preview-dot"></div>
              <div class="preview-dot"></div>
            </div>
            <div class="preview-lines">
              <div class="line w-90"></div>
              <div class="line w-70"></div>
              <div class="line w-80"></div>
              <div class="line w-60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="locked-foot">
      <button class="locked-btn" type="button" @click="$emit('action')">
        {{ actionText }}
      </button>
      <span class="locked-note" v-if="note">{{ note }}</span>
    </footer>
  </section>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '기능 잠김' },
  subtitle: { type: String, default: '' },
  message: { type: String, default: '아직 사용할 수 없는 기능이에요.' },
  hints: { type: Array, default: () => [] },
  actionText: { type: String, default: '연구로 이동' },
  note: { type: String, default: '' },
  previewCards: { type: Number, default: 6 },
  compact: { type: Boolean, default: false },
});
defineEmits(['action']);
</script>

<style scoped lang="scss">
@use "sass:color";
@use "@/styles/global.scss" as global;

.locked-panel {
  width: 100%;
  max-width: 1100px;
  margin: 18px auto;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: color.scale(global.$area-bg-color-center, $lightness: 4%);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  text-align: left;
}

.locked-panel.is-compact {
  margin: 12px auto;
  padding: 14px;
}

.locked-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.locked-badge {
  font-weight: 900;
  letter-spacing: 0.08em;
  font-size: 0.85em;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--highlight-color);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.locked-title {
  margin: 0;
  font-size: 1.25em;
  color: var(--text-color);
}

.locked-subtitle {
  margin: 4px 0 0;
  font-size: 0.95em;
  opacity: 0.75;
  color: var(--text-color);
}

.locked-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  padding-top: 14px;
}

.locked-message {
  padding: 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.locked-primary {
  margin: 0;
  font-size: 1.05em;
  color: var(--text-color);
}

.locked-list {
  margin: 10px 0 0;
  padding-left: 18px;
  opacity: 0.85;
}

.locked-preview {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.14);
  overflow: hidden;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 14px;
  filter: blur(0.2px);
  opacity: 0.7;
}

.preview-card {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 10px;
  min-height: 82px;
}

.preview-top {
  display: flex;
  gap: 6px;
  padding-bottom: 8px;
}

.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

.preview-lines .line {
  height: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.09);
  margin-top: 7px;
}
.w-90 { width: 90%; }
.w-80 { width: 80%; }
.w-70 { width: 70%; }
.w-60 { width: 60%; }

.locked-preview::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(0, 0, 0, 0.0),
    rgba(0, 0, 0, 0.25),
    rgba(0, 0, 0, 0.0)
  );
  pointer-events: none;
}

.locked-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
}

.locked-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  background: var(--accent-color);
  color: #fff;
  transition: transform 0.12s ease, filter 0.12s ease;
}
.locked-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
.locked-btn:active { transform: translateY(0px); filter: brightness(0.98); }

.locked-note {
  font-size: 0.92em;
  opacity: 0.75;
  color: var(--text-color);
}

/* 반응형 */
@media (max-width: 900px) {
  .locked-body { grid-template-columns: 1fr; }
  .preview-grid { grid-template-columns: 1fr; }
}
</style>
