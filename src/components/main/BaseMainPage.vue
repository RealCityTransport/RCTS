<!-- src/components/main/BaseMainPage.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 메인 컨텐츠 페이지의 공통 포맷을 담당하는 베이스 컴포넌트.
- Dashboard, Company, Research, ComingSoon 같은 페이지가 이 컴포넌트를 감싸서 사용한다.

현재 제공:
- eyebrow: 상단 작은 라벨.
- title: 페이지 제목.
- description: 페이지 설명.
- badge: 우측 상태 배지.
- tone: default / dark / soft 톤.
- default slot: 실제 페이지 본문.
- actions slot: 우측 액션 영역.

현재 연결:
- DashboardPage.vue
- CompanyPage.vue
- ResearchPage.vue
- ComingSoonPage.vue

주의:
- 새 메인 페이지를 만들 때는 가능하면 BaseMainPage.vue를 사용한다.
- 이렇게 해야 메인 컨텐츠의 제목/설명/본문 포맷이 통일된다.

다음 작업 방향:
- 페이지별 공통 액션 버튼, 탭, 필터, 상태 표시줄을 slot으로 확장할 수 있다.
-->

<template>
  <section class="base-main-page">
    <section class="main-panel" :class="`tone-${tone}`">
      <header class="main-page-header">
        <div class="header-text">
          <span v-if="eyebrow" class="eyebrow">
            {{ eyebrow }}
          </span>

          <h2>{{ title }}</h2>

          <p v-if="description">
            {{ description }}
          </p>
        </div>

        <div v-if="badge || $slots.actions" class="header-actions">
          <span v-if="badge" class="status-badge">
            {{ badge }}
          </span>

          <slot name="actions"></slot>
        </div>
      </header>

      <div v-if="$slots.default" class="main-page-body">
        <slot></slot>
      </div>
    </section>
  </section>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  badge: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'default',
  },
})
</script>

<style scoped>
.base-main-page {
  min-height: 100%;
}

.main-panel {
  min-height: 420px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.08);
}

.main-page-header {
  min-height: 148px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px 36px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), transparent 48%),
    #ffffff;
  border-bottom: 1px solid var(--panel-border);
}

.tone-dark .main-page-header {
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.22), transparent 50%),
    #172033;
  color: white;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.tone-soft .main-page-header {
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent 48%),
    #f8fafc;
}

.header-text {
  min-width: 0;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.tone-dark .eyebrow {
  color: #93c5fd;
}

.main-page-header h2 {
  margin: 0;
  color: #111827;
  font-size: 32px;
  line-height: 1.25;
}

.tone-dark .main-page-header h2 {
  color: white;
}

.main-page-header p {
  max-width: 760px;
  margin: 10px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.tone-dark .main-page-header p {
  color: #cbd5e1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--blue);
  font-size: 13px;
  font-weight: 900;
}

.tone-dark .status-badge {
  background: rgba(255, 255, 255, 0.12);
  color: #dbeafe;
}

.main-page-body {
  padding: 22px;
}

@media (max-width: 820px) {
  .main-panel {
    min-height: 320px;
  }

  .main-page-header {
    min-height: auto;
    flex-direction: column;
    align-items: flex-start;
    padding: 28px 20px;
  }

  .main-page-header h2 {
    font-size: 26px;
  }

  .header-actions {
    width: 100%;
  }

  .main-page-body {
    padding: 14px;
  }
}
</style>