<!-- src/components/routes/RoutesToolbar.vue -->
<template>
  <section class="toolbar">
    <div class="toolbar-left">
      <!-- 검색 -->
      <div class="field search-field">
        <label class="field-label">검색</label>
        <input
          v-model="localSearch"
          type="text"
          class="field-input"
          placeholder="노선 이름 또는 태그로 검색"
          @input="emitSearch"
        />
      </div>

      <!-- 상태 필터: 전체 / 설계중 / 건설중 / 운영중 -->
      <div class="field">
        <label class="field-label">상태</label>
        <select
          v-model="localStatus"
          class="field-select"
          @change="emitStatus"
        >
          <option value="all">전체</option>
          <option value="설계중">설계 중</option>
          <option value="건설중">건설 중</option>
          <option value="운영중">운영 중</option>
        </select>
      </div>

      <!-- 정렬 -->
      <div class="field">
        <label class="field-label">정렬</label>
        <select
          v-model="localSortKey"
          class="field-select"
          @change="emitSortKey"
        >
          <option value="updated-desc">최근 수정순</option>
          <option value="name-asc">이름 오름차순</option>
          <option value="name-desc">이름 내림차순</option>
        </select>
      </div>
    </div>

    <div class="toolbar-right">
      <div class="routes-count">
        총
        <span class="routes-count-number">
          {{ totalCount }}
        </span>
        개 노선
      </div>

      <button
        type="button"
        class="primary-button"
        @click="$emit('create-route')"
      >
        + 새 노선 만들기
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  searchText: {
    type: String,
    default: '',
  },
  statusFilter: {
    type: String,
    default: 'all', // 'all' | '설계중' | '건설중' | '운영중'
  },
  sortKey: {
    type: String,
    default: 'updated-desc',
  },
  totalCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update:search-text',
  'update:status-filter',
  'update:sort-key',
  'create-route',
])

const localSearch = ref(props.searchText)
const localStatus = ref(props.statusFilter)
const localSortKey = ref(props.sortKey)

watch(
  () => props.searchText,
  (val) => {
    if (val !== localSearch.value) localSearch.value = val
  },
)
watch(
  () => props.statusFilter,
  (val) => {
    if (val !== localStatus.value) localStatus.value = val
  },
)
watch(
  () => props.sortKey,
  (val) => {
    if (val !== localSortKey.value) localSortKey.value = val
  },
)

function emitSearch() {
  emit('update:search-text', localSearch.value)
}

function emitStatus() {
  emit('update:status-filter', localStatus.value)
}

function emitSortKey() {
  emit('update:sort-key', localSortKey.value)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-field {
  min-width: 200px;
}

.field-label {
  font-size: 0.74rem;
  opacity: 0.8;
}

.field-input,
.field-select {
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-size: 0.8rem;
}

.field-input::placeholder {
  opacity: 0.6;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.routes-count {
  font-size: 0.78rem;
  opacity: 0.8;
  white-space: nowrap;
}

.routes-count-number {
  font-weight: 700;
  margin: 0 4px;
}

.primary-button {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(94, 234, 212, 0.9);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(45, 212, 191, 0.28),
    rgba(15, 23, 42, 0.9)
  );
  color: #e5e7eb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.primary-button:hover {
  filter: brightness(1.08);
}

.primary-button:active {
  transform: translateY(1px);
}

/* 반응형 */
@media (max-width: 700px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: space-between;
  }
}
</style>
