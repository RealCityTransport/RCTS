<!-- src/components/devlog/DevlogPage.vue -->
<template>
  <section class="devlog-root">
    <header class="devlog-head">
      <div class="devlog-head-left">
        <div class="devlog-title">개발로그</div>
        <div class="devlog-sub">예정/진행은 드래그로 순서 조정 가능</div>
      </div>

      <div class="devlog-head-right">
        <div class="devlog-auth">
          <span class="auth-state" :class="{ 'is-on': isLoggedIn }">
            {{ isLoggedIn ? '로그인됨' : '로그아웃됨' }}
          </span>
          <span v-if="isLoggedIn" class="auth-mail">{{ userEmail }}</span>
        </div>
      </div>
    </header>

    <!-- ✅ 관리자 등록 영역 (evepoi86@gmail.com 만) -->
    <section v-if="isAdmin" class="compose">
      <div class="compose-title">등록</div>

      <div class="compose-grid">
        <label class="field">
          <div class="label">제목</div>
          <input v-model="newTitle" class="input" type="text" placeholder="한 줄 제목" />
        </label>

        <label class="field">
          <div class="label">상세</div>
          <textarea
            v-model="newDetail"
            class="textarea"
            rows="3"
            placeholder="세부 내용 (짧게)"
          ></textarea>
        </label>
      </div>

      <div class="compose-actions">
        <button class="btn btn-primary" type="button" @click="handleAdd" :disabled="adding">
          {{ adding ? '등록 중...' : '등록 (예정으로)' }}
        </button>
        <div v-if="composeError" class="hint is-error">{{ composeError }}</div>
        <div v-else class="hint">등록은 항상 “예정”으로 들어가요.</div>
      </div>
    </section>

    <!-- Tabs -->
    <nav class="tabs" aria-label="개발로그 탭">
      <button
        type="button"
        class="tab"
        :class="{ 'is-active': activeTab === 'plan' }"
        @click="activeTab = 'plan'"
      >
        예정 <span class="count">{{ planList.length }}</span>
      </button>
      <button
        type="button"
        class="tab"
        :class="{ 'is-active': activeTab === 'doing' }"
        @click="activeTab = 'doing'"
      >
        진행 <span class="count">{{ doingList.length }}</span>
      </button>
      <button
        type="button"
        class="tab"
        :class="{ 'is-active': activeTab === 'done' }"
        @click="activeTab = 'done'"
      >
        완료 <span class="count">{{ doneList.length }}</span>
      </button>
    </nav>

    <!-- Lists -->
    <main class="lists">
      <!-- PLAN -->
      <section v-if="activeTab === 'plan'" class="panel">
        <div class="panel-head">
          <div class="panel-title">예정</div>
          <div class="panel-sub">드래그로 우선순위 정렬 (알림에도 반영)</div>
        </div>

        <div class="list">
          <article
            v-for="it in planList"
            :key="it.id"
            class="card status--plan"
            :class="{ 'is-dragging': dragState.draggingId === it.id }"
            :draggable="isAdmin"
            @dragstart="onDragStart($event, it, 'plan')"
            @dragover.prevent="onDragOver($event, it, 'plan')"
            @drop.prevent="onDrop($event, it, 'plan')"
            @dragend="onDragEnd"
          >
            <div class="card-row">
              <div class="card-left">
                <span v-if="isAdmin" class="drag-handle" title="드래그로 순서 변경">⋮⋮</span>
                <div class="card-title">{{ it.title }}</div>
              </div>

              <div class="card-actions">
                <button v-if="isAdmin" class="mini" type="button" @click="openEdit(it)">
                  수정
                </button>
                <button v-if="isAdmin" class="mini" type="button" @click="moveToDoing(it.id)">
                  → 진행
                </button>
                <button
                  v-if="isAdmin"
                  class="mini is-danger"
                  type="button"
                  @click="deletePlan(it)"
                >
                  삭제
                </button>
              </div>
            </div>

            <div v-if="it.detail" class="card-detail">{{ it.detail }}</div>

            <div v-if="dragState.overId === it.id && dragState.listKey === 'plan'" class="drop-hint">
              여기로 이동
            </div>
          </article>

          <div v-if="!planList.length" class="empty">예정 항목이 없어요.</div>
        </div>
      </section>

      <!-- DOING -->
      <section v-if="activeTab === 'doing'" class="panel">
        <div class="panel-head">
          <div class="panel-title">진행</div>
          <div class="panel-sub">드래그로 진행 순서 정렬 (알림에도 반영)</div>
        </div>

        <div class="list">
          <article
            v-for="it in doingList"
            :key="it.id"
            class="card status--doing"
            :class="{ 'is-dragging': dragState.draggingId === it.id }"
            :draggable="isAdmin"
            @dragstart="onDragStart($event, it, 'doing')"
            @dragover.prevent="onDragOver($event, it, 'doing')"
            @drop.prevent="onDrop($event, it, 'doing')"
            @dragend="onDragEnd"
          >
            <div class="card-row">
              <div class="card-left">
                <span v-if="isAdmin" class="drag-handle" title="드래그로 순서 변경">⋮⋮</span>
                <div class="card-title">{{ it.title }}</div>
              </div>

              <div class="card-actions">
                <button v-if="isAdmin" class="mini" type="button" @click="openEdit(it)">
                  수정
                </button>
                <button v-if="isAdmin" class="mini" type="button" @click="moveDoingToPlan(it.id)">
                  → 예정
                </button>
                <button v-if="isAdmin" class="mini" type="button" @click="moveDoingToDone(it.id)">
                  → 완료
                </button>
              </div>
            </div>

            <div v-if="it.detail" class="card-detail">{{ it.detail }}</div>

            <div v-if="dragState.overId === it.id && dragState.listKey === 'doing'" class="drop-hint">
              여기로 이동
            </div>
          </article>

          <div v-if="!doingList.length" class="empty">진행 항목이 없어요.</div>
        </div>
      </section>

      <!-- DONE -->
      <section v-if="activeTab === 'done'" class="panel">
        <div class="panel-head">
          <div class="panel-title">완료</div>
          <div class="panel-sub">최신 완료가 위로 (최대 20개)</div>
        </div>

        <div class="list">
          <article v-for="it in doneList" :key="it.id" class="card status--done">
            <div class="card-row">
              <div class="card-left">
                <div class="card-title">{{ it.title }}</div>
              </div>

              <div class="card-actions">
                <button v-if="isAdmin" class="mini" type="button" @click="openEdit(it)">
                  수정
                </button>
                <button v-if="isAdmin" class="mini" type="button" @click="moveDoneToPlan(it.id)">
                  → 예정
                </button>
              </div>
            </div>

            <div v-if="it.detail" class="card-detail">{{ it.detail }}</div>
          </article>

          <div v-if="!doneList.length" class="empty">완료 항목이 없어요.</div>
        </div>
      </section>
    </main>

    <!-- Edit modal -->
    <div v-if="edit.open" class="modal-backdrop" @click.self="closeEdit">
      <div class="modal">
        <div class="modal-title">내용 수정</div>

        <label class="field">
          <div class="label">제목</div>
          <input v-model="edit.title" class="input" type="text" />
        </label>

        <label class="field">
          <div class="label">상세</div>
          <textarea v-model="edit.detail" class="textarea" rows="4"></textarea>
        </label>

        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" @click="closeEdit">닫기</button>
          <button class="btn btn-primary" type="button" @click="saveEdit" :disabled="edit.saving">
            {{ edit.saving ? '저장 중...' : '저장' }}
          </button>
        </div>

        <div v-if="edit.error" class="hint is-error">{{ edit.error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useDevlogsTicker } from '@/composables/useDevlogsTicker.js'

const ADMIN_EMAIL = 'evepoi86@gmail.com'

const { isLoggedIn, user } = useAuth()

const userEmail = computed(() => {
  const u = user?.value
  const mail = u?.email
  return typeof mail === 'string' ? mail : ''
})

const isAdmin = computed(() => isLoggedIn.value && userEmail.value === ADMIN_EMAIL)

/* tabs */
const activeTab = ref('plan')

/* drag state */
const dragState = reactive({
  draggingId: '',
  listKey: '',
  overId: '',
})

/* devlogs */
const {
  start,
  planItems,
  doingItems,
  doneItems,
  doneOverflowIds,
  addDevlog,
  updateDevlog,
  moveToDoing,
  moveDoingToPlan,
  moveDoingToDone,
  moveDoneToPlan,
  deactivatePlanOnly,
  reorderStatus,
  pruneDoneOverflow,
} = useDevlogsTicker()

onMounted(() => start())

/* local lists */
const planList = ref([])
const doingList = ref([])
const doneList = computed(() => doneItems.value || [])

const syncFromServer = () => {
  planList.value = [...(planItems.value || [])]
  doingList.value = [...(doingItems.value || [])]
}

/* sync watchers */
watch(
  () => (planItems.value || []).map((x) => `${x.id}:${x.orderMs ?? x.createdAtMs ?? 0}`).join('|'),
  () => {
    if (!dragState.draggingId) syncFromServer()
  },
  { immediate: true },
)

watch(
  () => (doingItems.value || []).map((x) => `${x.id}:${x.orderMs ?? x.createdAtMs ?? 0}`).join('|'),
  () => {
    if (!dragState.draggingId) syncFromServer()
  },
  { immediate: true },
)

/**
 * ✅ 완료 21개 이상이면 Firestore에서 자동 삭제
 * - 관리자만 실행
 * - doneOverflowIds가 생기는 순간 prune
 */
let pruning = false
watch(
  () => (doneOverflowIds.value || []).join('|'),
  async (v) => {
    if (!isAdmin.value) return
    if (!v) return
    if (pruning) return
    pruning = true
    try {
      await pruneDoneOverflow(20)
    } catch (e) {
      console.warn(e)
    } finally {
      pruning = false
    }
  },
  { immediate: true },
)

/* compose */
const newTitle = ref('')
const newDetail = ref('')
const adding = ref(false)
const composeError = ref('')

const handleAdd = async () => {
  composeError.value = ''
  if (!isAdmin.value) return

  const t = String(newTitle.value || '').trim()
  if (!t) {
    composeError.value = '제목을 입력해줘.'
    return
  }

  adding.value = true
  try {
    await addDevlog({ title: t, detail: newDetail.value })
    newTitle.value = ''
    newDetail.value = ''
    activeTab.value = 'plan'
  } catch (e) {
    composeError.value = e?.message ? String(e.message) : '등록 실패'
  } finally {
    adding.value = false
  }
}

/* edit */
const edit = reactive({
  open: false,
  id: '',
  title: '',
  detail: '',
  saving: false,
  error: '',
})

const openEdit = (it) => {
  if (!isAdmin.value) return
  edit.open = true
  edit.id = it.id
  edit.title = String(it.title ?? '')
  edit.detail = String(it.detail ?? '')
  edit.error = ''
}

const closeEdit = () => {
  edit.open = false
  edit.id = ''
  edit.title = ''
  edit.detail = ''
  edit.saving = false
  edit.error = ''
}

const saveEdit = async () => {
  if (!isAdmin.value) return
  if (!edit.id) return
  edit.error = ''
  edit.saving = true
  try {
    await updateDevlog(edit.id, { title: edit.title, detail: edit.detail })
    closeEdit()
  } catch (e) {
    edit.error = e?.message ? String(e.message) : '저장 실패'
  } finally {
    edit.saving = false
  }
}

const deletePlan = async (it) => {
  if (!isAdmin.value) return
  try {
    await deactivatePlanOnly(it.id, it.status)
  } catch (e) {
    console.warn(e)
  }
}

/* drag helpers */
const getListRef = (listKey) => (listKey === 'doing' ? doingList : planList)

const onDragStart = (e, it, listKey) => {
  if (!isAdmin.value) return

  dragState.draggingId = it.id
  dragState.listKey = listKey
  dragState.overId = ''

  try {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', it.id)
  } catch (_) {}
}

const onDragOver = (e, it, listKey) => {
  if (!isAdmin.value) return
  if (!dragState.draggingId) return
  if (dragState.listKey !== listKey) return
  dragState.overId = it.id
}

const onDrop = async (e, it, listKey) => {
  if (!isAdmin.value) return
  if (!dragState.draggingId) return
  if (dragState.listKey !== listKey) return

  const listRef = getListRef(listKey)
  const list = [...listRef.value]

  const from = list.findIndex((x) => x.id === dragState.draggingId)
  const to = list.findIndex((x) => x.id === it.id)
  if (from < 0 || to < 0 || from === to) {
    dragState.overId = ''
    return
  }

  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)

  listRef.value = list
  dragState.overId = ''

  try {
    await reorderStatus(listKey, list.map((x) => x.id))
  } catch (err) {
    syncFromServer()
    console.warn(err)
  }
}

const onDragEnd = () => {
  dragState.draggingId = ''
  dragState.listKey = ''
  dragState.overId = ''
}
</script>

<style scoped>
/* (스타일은 기존 그대로) */
.devlog-root {
  width: 100%;
  min-height: 100%;
  padding: 12px;
  box-sizing: border-box;
  color: rgba(226, 232, 240, 0.92);
}

.devlog-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
}

.devlog-title {
  font-size: 1.08rem;
  font-weight: 950;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.devlog-sub {
  margin-top: 4px;
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 800;
}

.devlog-auth {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.auth-state {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.72);
}
.auth-state.is-on {
  color: rgba(226, 232, 240, 0.92);
}
.auth-mail {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(191, 219, 254, 0.92);
}

.compose {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
}

.compose-title {
  font-weight: 950;
  color: rgba(248, 250, 252, 0.95);
}

.compose-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.field .label {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(148, 163, 184, 0.92);
  margin-bottom: 6px;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.22);
  color: rgba(226, 232, 240, 0.92);
  font-weight: 800;
  padding: 10px 10px;
  outline: none;
}

.textarea {
  resize: vertical;
  min-height: 74px;
}

.compose-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hint {
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.7);
  font-weight: 800;
}
.hint.is-error {
  color: rgba(248, 113, 113, 0.95);
}

.tabs {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.18);
  color: rgba(226, 232, 240, 0.86);
  font-weight: 950;
  cursor: pointer;
}

.tab.is-active {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(129, 140, 248, 0.10);
  color: rgba(248, 250, 252, 0.96);
}

.count {
  margin-left: 6px;
  font-size: 0.78rem;
  opacity: 0.9;
}

.lists {
  margin-top: 12px;
}

.panel {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.16);
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.panel-title {
  font-weight: 950;
  color: rgba(248, 250, 252, 0.95);
}

.panel-sub {
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.70);
  font-weight: 800;
}

.list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.22);
  padding: 10px 10px;
  position: relative;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.card-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.25);
  color: rgba(226, 232, 240, 0.88);
  font-weight: 1000;
  cursor: grab;
  user-select: none;
}

.card-title {
  font-weight: 950;
  color: rgba(248, 250, 252, 0.95);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(860px, 100%);
}

.card-detail {
  margin-top: 8px;
  font-size: 0.84rem;
  color: rgba(226, 232, 240, 0.86);
  font-weight: 800;
  line-height: 1.6;
  white-space: pre-wrap;
}

.card-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini {
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.18);
  color: rgba(226, 232, 240, 0.88);
  font-weight: 950;
  cursor: pointer;
}

.mini.is-danger {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.10);
  color: rgba(248, 250, 252, 0.92);
}

.drop-hint {
  margin-top: 10px;
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.80);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.18);
}

.status--plan {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.08);
}

.status--doing {
  border-color: rgba(251, 191, 36, 0.40);
  background: rgba(251, 191, 36, 0.08);
}

.status--done {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.08);
}

.empty {
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.14);
  text-align: center;
  color: rgba(226, 232, 240, 0.68);
  font-weight: 850;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  z-index: 9999;
}

.modal {
  width: min(720px, 100%);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(10, 14, 24, 0.98);
  padding: 14px;
}

.modal-title {
  font-weight: 950;
  color: rgba(248, 250, 252, 0.96);
  margin-bottom: 10px;
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 9px 12px;
  border-radius: 12px;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-ghost {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.18);
  color: rgba(226, 232, 240, 0.9);
}

.btn-primary {
  border-color: rgba(129, 140, 248, 0.22);
  background: rgba(129, 140, 248, 0.18);
  color: rgba(248, 250, 252, 0.96);
}

@media (max-width: 640px) {
  .devlog-root {
    padding: 10px;
  }
  .card-title {
    max-width: 100%;
  }
}
</style>
