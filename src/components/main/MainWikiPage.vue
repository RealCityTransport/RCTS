<!-- src/components/main/MainWikiPage.vue -->
<template>
  <div class="wiki-page">
    <!-- 상단 헤더 -->
    <header class="wiki-header">
      <div class="wiki-title-row">
        <h2 class="wiki-title">RCTS 위키</h2>

        <span
          class="wiki-badge"
          :class="{ admin: isAdmin }"
        >
          {{ isAdmin ? 'INTERNAL · ADMIN' : 'INTERNAL DOCS' }}
        </span>
      </div>

      <p class="wiki-desc">
        RCTS의 규칙, 시스템, 설계 철학을 정리해 두는 내부 위키입니다.<br />
        운송·연구·건설·재정 시스템과 관련된 개념/공식/운영 메모를 여기서 찾아볼 수 있습니다.
      </p>
    </header>

    <!-- 본문 레이아웃 -->
    <section class="wiki-layout">
      <!-- 좌측: 문서 목록 -->
      <aside class="wiki-nav">
        <div class="nav-header">
          <h3 class="nav-title">문서 목록</h3>

          <button
            v-if="isAdmin"
            type="button"
            class="primary-button"
            @click="startCreate"
          >
            새 문서
          </button>
        </div>

        <!-- 카테고리 그룹 -->
        <template
          v-for="(list, cat) in groupedPages"
          :key="cat"
        >
          <p class="group-title">
            {{ cat || '기타' }}
          </p>

          <ul class="nav-section">
            <li
              v-for="doc in list"
              :key="doc.id"
              class="nav-item"
              :class="{ active: selectedId === doc.id }"
              @click="select(doc.id)"
            >
              {{ doc.title || '(제목 없음)' }}
            </li>
          </ul>
        </template>

        <p
          v-if="loading"
          class="nav-empty"
        >
          불러오는 중...
        </p>

        <p
          v-if="!loading && !pages.length"
          class="nav-empty"
        >
          아직 등록된 문서가 없습니다.
        </p>
      </aside>

      <!-- 우측: 내용 -->
      <article class="wiki-content">
        <!-- 작성 / 수정 폼 -->
        <section
          v-if="isAdmin && editMode"
          class="wiki-editor"
        >
          <h3 class="content-title">
            {{ editingId ? '문서 수정' : '새 문서 작성' }}
          </h3>

          <div class="editor-row">
            <label>
              제목
              <input
                v-model="draft.title"
                type="text"
                class="editor-input"
                placeholder="문서 제목을 입력하세요"
              />
            </label>
          </div>

          <div class="editor-row">
            <label>
              카테고리 (예: 운송 시스템 / 버스)
              <input
                v-model="draft.category"
                type="text"
                class="editor-input"
                placeholder="카테고리를 입력하세요"
              />
            </label>
          </div>

          <div class="editor-row">
            <label>
              본문
              <textarea
                v-model="draft.body"
                class="editor-textarea"
                rows="10"
                placeholder="여기에 위키 본문을 작성하세요."
              ></textarea>
            </label>
          </div>

          <div class="editor-footer">
            <p
              v-if="errorMessage"
              class="error-text"
            >
              {{ errorMessage }}
            </p>

            <div class="editor-buttons">
              <button
                type="button"
                class="secondary-button"
                @click="cancelEdit"
              >
                취소
              </button>

              <button
                type="button"
                class="primary-button"
                :disabled="saving"
                @click="save"
              >
                {{ saving ? '저장 중...' : '저장' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 문서 표시 -->
        <section v-else>
          <template v-if="selectedPage">
            <header>
              <h3 class="content-title">
                {{ selectedPage.title }}
              </h3>

              <p class="content-meta">
                {{ selectedPage.category || '카테고리 없음' }} ·
                {{ formatDate(selectedPage.updatedAt || selectedPage.createdAt) }}
              </p>
            </header>

            <!-- ★ 여기만 변경: Markdown 렌더링 -->
            <div
              class="content-body"
              v-html="renderMarkdown(selectedPage.body || '(내용 없음)')"
            ></div>

            <div
              v-if="isAdmin"
              class="content-actions"
            >
              <button
                class="primary-button"
                @click="startEdit"
              >
                수정
              </button>

              <button
                class="danger-button"
                @click="remove"
              >
                삭제
              </button>
            </div>
          </template>

          <p
            v-else
            class="empty-body"
          >
            왼쪽에서 문서를 선택하거나, 새 문서를 작성하세요.
          </p>
        </section>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { marked } from 'marked'

import { db } from '@/libs/firebase'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'

/* -----------------------
   관리자 판정
------------------------ */
const { user } = useFirebaseAuth()

const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS || ''
const ADMIN_EMAILS = ADMIN_EMAILS_ENV
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

const isAdmin = computed(() => {
  if (!user.value?.email) return false
  if (ADMIN_EMAILS.length) return ADMIN_EMAILS.includes(user.value.email)
  return true
})

/* -----------------------
   Firestore 구독
------------------------ */
const loading = ref(true)
const pages = ref([])

function mapDoc(snap) {
  const data = snap.data() || {}

  return {
    id: snap.id,
    title: data.title ?? '',
    category: data.category ?? '',
    body: data.body ?? '',
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  }
}

let unsubscribe = null

onMounted(() => {
  const col = collection(db, 'wiki_pages')
  const q = query(col, orderBy('updatedAt', 'desc'))

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      pages.value = snapshot.docs.map(mapDoc)
      loading.value = false
    },
    () => (loading.value = false)
  )
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/* -----------------------
   카테고리 그룹
------------------------ */
const groupedPages = computed(() => {
  const groups = {}

  for (const p of pages.value) {
    const key = p.category?.trim() || '기타'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }

  return groups
})

/* -----------------------
   선택된 문서
------------------------ */
const selectedId = ref(null)

const selectedPage = computed(() =>
  pages.value.find((p) => p.id === selectedId.value)
)

function select(id) {
  selectedId.value = id
  editMode.value = false
}

/* -----------------------
   에디터 상태
------------------------ */
const editMode = ref(false)
const editingId = ref(null)

const draft = ref({
  title: '',
  body: '',
  category: '',
})

const saving = ref(false)
const errorMessage = ref('')

function resetDraft() {
  draft.value = {
    title: '',
    body: '',
    category: '',
  }
  errorMessage.value = ''
}

function startCreate() {
  editingId.value = null
  resetDraft()
  editMode.value = true
}

function startEdit() {
  if (!selectedPage.value) return
  editingId.value = selectedPage.value.id
  draft.value = {
    title: selectedPage.value.title,
    body: selectedPage.value.body,
    category: selectedPage.value.category,
  }
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  editingId.value = null
}

/* -----------------------
   저장
------------------------ */
async function save() {
  if (!isAdmin.value) return

  const title = draft.value.title.trim()
  const body = draft.value.body.trim()

  if (!title) {
    errorMessage.value = '제목을 입력하세요.'
    return
  }

  if (!body) {
    errorMessage.value = '본문을 입력하세요.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    if (editingId.value) {
      const refDoc = doc(db, 'wiki_pages', editingId.value)
      await updateDoc(refDoc, {
        title,
        body,
        category: draft.value.category.trim(),
        updatedAt: serverTimestamp(),
      })
      selectedId.value = editingId.value
    } else {
      const col = collection(db, 'wiki_pages')
      const added = await addDoc(col, {
        title,
        body,
        category: draft.value.category.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      selectedId.value = added.id
    }

    editMode.value = false
    editingId.value = null
  } finally {
    saving.value = false
  }
}

/* -----------------------
   삭제
------------------------ */
async function remove() {
  if (!isAdmin.value || !selectedPage.value) return

  const ok = window.confirm('이 문서를 삭제할까요? 되돌릴 수 없습니다.')
  if (!ok) return

  const refDoc = doc(db, 'wiki_pages', selectedPage.value.id)
  await deleteDoc(refDoc)

  selectedId.value = null
}

/* -----------------------
   Markdown 렌더링
------------------------ */
function renderMarkdown(text) {
  return marked.parse(text || '')
}

/* -----------------------
   날짜 포맷
------------------------ */
function formatDate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<style scoped>
.wiki-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 헤더 ===== */

.wiki-header {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.wiki-title-row {
  display: flex;
  justify-content: space-between;
}

.wiki-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
}

/* ===== 레이아웃 ===== */

.wiki-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

/* ===== 좌측 메뉴 ===== */

.wiki-nav {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.nav-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.group-title {
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0.9;
  margin-top: 8px;
  margin-bottom: 2px;
}

.nav-section {
  list-style: none;
  padding: 0;
  margin: 0 0 6px;
}

.nav-item {
  padding: 4px 6px;
  border-radius: 8px;
  cursor: pointer;
}

.nav-item.active {
  background: rgba(129, 140, 248, 0.28);
}

.nav-empty {
  opacity: 0.7;
}

/* ===== 버튼 ===== */

.primary-button {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.9);
  font-size: 0.78rem;
}

.secondary-button,
.danger-button {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
}

/* ===== 우측 내용 ===== */

.wiki-content {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.content-body {
  margin-top: 10px;
  line-height: 1.6;
  font-size: 0.9rem;
}
</style>
