<!-- src/components/main/MainDevlogPage.vue -->
<template>
  <div class="devlog-root">
    <!-- 상단 헤더 -->
    <section class="devlog-header">
      <div class="header-main">
        <p class="header-badge">Admin Workspace · Internal Devlog</p>
        <h2 class="header-title">RCTS DEVLOG</h2>
        <p class="header-subtitle">
          이 영역은 관리자가 개발 기록을 정리하고,
          설계 변경 사항과 실험 결과, 샘플링된 자료를 모아두는 내부 기록 공간입니다.
          나중에는 외부 공개용 글과 내부 전용 메모를 함께 관리할 수 있는 구조를 목표로 합니다.
        </p>
      </div>

      <aside class="header-side">
        <h3 class="side-title">DEVLOG 사용 목적</h3>
        <ul class="side-list">
          <li>개발 중 떠오르는 메모/아이디어를 빠르게 적어두기</li>
          <li>패치 노트 및 릴리즈 히스토리 정리</li>
          <li>DTS · RCTS 설계 변경 내역 기록</li>
          <li>샘플링된 데이터/스크린샷/실험 결과 아카이빙</li>
        </ul>
      </aside>
    </section>

    <!-- 메인 레이아웃 -->
    <section class="devlog-layout">
      <!-- 왼쪽: 필터 + 목록 -->
      <div class="devlog-main">
        <!-- 툴바 영역 -->
        <div class="devlog-toolbar">
          <div class="toolbar-tabs">
            <button
              type="button"
              class="tab-button"
              :class="{ active: activeType === 'all' }"
              @click="activeType = 'all'"
            >
              전체
            </button>
            <button
              type="button"
              class="tab-button"
              :class="{ active: activeType === 'note' }"
              @click="activeType = 'note'"
            >
              일반 메모
            </button>
            <button
              type="button"
              class="tab-button"
              :class="{ active: activeType === 'patch' }"
              @click="activeType = 'patch'"
            >
              패치 노트
            </button>
            <button
              type="button"
              class="tab-button"
              :class="{ active: activeType === 'sample' }"
              @click="activeType = 'sample'"
            >
              실험 · 샘플
            </button>
            <button
              type="button"
              class="tab-button"
              :class="{ active: activeType === 'todo' }"
              @click="activeType = 'todo'"
            >
              TODO / 계획
            </button>
          </div>

          <div class="toolbar-actions">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input"
                v-model="keyword"
                placeholder="제목, 요약으로 검색"
              />
            </div>

            <div class="toolbar-right">
              <button
                v-if="!isAdmin"
                type="button"
                class="primary-button primary-button--disabled"
                disabled
              >
                새 글 작성 (관리자 전용)
              </button>
              <button
                v-else
                type="button"
                class="primary-button"
                @click="toggleEditor"
              >
                {{ showEditor ? (isEditing ? '수정 취소' : '작성 취소') : '새 글 작성' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 새 글 / 수정 폼 (관리자 전용) -->
        <section
          v-if="isAdmin && showEditor"
          class="devlog-editor"
        >
          <h3 class="editor-title">
            {{ isEditing ? 'DEVLOG 수정' : '새 DEVLOG 작성' }}
          </h3>

          <div class="editor-row">
            <label class="editor-label">
              제목
              <input
                v-model="draft.title"
                type="text"
                class="editor-input"
                placeholder="예: OSM 데이터 파이프라인 1차 정리"
              />
            </label>
          </div>

          <div class="editor-row editor-row--two">
            <label class="editor-label">
              타입
              <select
                v-model="draft.type"
                class="editor-select"
              >
                <option value="note">일반 메모</option>
                <option value="patch">패치 노트</option>
                <option value="sample">실험 · 샘플</option>
                <option value="todo">TODO / 계획</option>
              </select>
            </label>

            <label class="editor-label">
              상태 (선택)
              <input
                v-model="draft.status"
                type="text"
                class="editor-input"
                placeholder="예: 진행 중 / 완료 / 계획"
              />
            </label>

            <label class="editor-label">
              버전 (선택)
              <input
                v-model="draft.version"
                type="text"
                class="editor-input"
                placeholder="예: layout-2025.12"
              />
            </label>
          </div>

          <div class="editor-row">
            <label class="editor-label">
              요약 / 메모
              <textarea
                v-model="draft.summary"
                class="editor-textarea"
                rows="3"
                placeholder="DEVLOG 카드에 표시할 간단한 요약을 작성해 주세요."
              ></textarea>
            </label>
          </div>

          <div class="editor-footer">
            <p
              v-if="errorMessage"
              class="editor-error"
            >
              {{ errorMessage }}
            </p>
            <button
              type="button"
              class="primary-button"
              :disabled="saving"
              @click="saveDevlog"
            >
              {{
                saving
                  ? '저장 중...'
                  : isEditing
                    ? 'DEVLOG 수정 저장'
                    : 'DEVLOG 저장'
              }}
            </button>
          </div>
        </section>

        <!-- DEVLOG 리스트 영역 -->
        <div class="devlog-list">
          <p
            v-if="loading"
            class="devlog-empty"
          >
            DEVLOG를 불러오는 중입니다...
          </p>
          <p
            v-else-if="!filteredDevlogs.length"
            class="devlog-empty"
          >
            아직 등록된 DEVLOG가 없습니다.
            상단의 “새 글 작성” 버튼으로 첫 기록을 남겨보세요.
          </p>

          <article
            v-for="post in filteredDevlogs"
            :key="post.id"
            class="devlog-card"
          >
            <header class="card-header">
              <h3 class="card-title">
                {{ post.title || '(제목 없음)' }}
              </h3>
              <span
                class="card-tag"
                :class="tagClass(post.type)"
              >
                {{ typeLabel(post.type) }}
              </span>
            </header>

            <div class="card-meta">
              <span
                v-if="post.createdAt"
                class="meta-item"
              >
                작성일 · {{ formatDate(post.createdAt) }}
              </span>
              <span
                v-if="post.status && post.createdAt"
                class="meta-separator"
              >
                ·
              </span>
              <span
                v-if="post.status"
                class="meta-item"
              >
                상태 · {{ post.status }}
              </span>
              <span
                v-if="post.version && (post.status || post.createdAt)"
                class="meta-separator"
              >
                ·
              </span>
              <span
                v-if="post.version"
                class="meta-item"
              >
                버전 · {{ post.version }}
              </span>
            </div>

            <p class="card-summary">
              {{ post.summary || '(요약 없음)' }}
            </p>

            <!-- 관리자 전용 수정/삭제 버튼 -->
            <div
              v-if="isAdmin"
              class="card-footer"
            >
              <button
                type="button"
                class="card-edit"
                @click="beginEdit(post)"
              >
                수정
              </button>
              <button
                type="button"
                class="card-delete"
                @click="deleteDevlog(post.id)"
              >
                삭제
              </button>
            </div>
          </article>
        </div>
      </div>

      <!-- 오른쪽: 가이드 / 메모 -->
      <aside class="devlog-side">
        <section class="side-card">
          <h3 class="side-card-title">작성 가이드 (내부 메모)</h3>
          <ul class="side-card-list">
            <li>제목은 한눈에 용도와 범위를 알 수 있게 작성하기</li>
            <li>도입부 2~3줄에 “무엇을, 왜, 어느 범위까지” 정리</li>
            <li>가능하면 스크린샷 · 코드 블록 · 데이터 조각을 함께 기록</li>
            <li>외부 공개 가능 여부(공개 / 내부 전용)를 메모</li>
          </ul>
        </section>

        <section class="side-card">
          <h3 class="side-card-title">향후 기능 아이디어</h3>
          <ul class="side-card-list">
            <li>DEVLOG 글 작성/수정 전용 에디터 연결</li>
            <li>태그별 필터링 및 검색 기능 강화</li>
            <li>“샘플링 데이터” 전용 첨부/뷰어 모듈</li>
            <li>DEVLOG에서 일부 글을 WIKI/ABOUT로 승격하는 플로우</li>
          </ul>
        </section>
      </aside>
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
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'

// --- Auth / Admin 판별 ---
const { user } = useFirebaseAuth()

// 쉼표로 구분된 관리자 이메일 리스트 (예: "a@b.com,c@d.com")
const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS || ''
const ADMIN_EMAILS = ADMIN_EMAILS_ENV
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

const isAdmin = computed(() => {
  const u = user.value
  if (!u || !u.email) return false

  // 환경변수에 관리자가 지정되어 있으면 그 리스트만 허용
  if (ADMIN_EMAILS.length > 0) {
    return ADMIN_EMAILS.includes(u.email)
  }

  // 환경변수가 없으면, 로그인된 사용자 전체를 관리자 취급 (개인 개발용 기본)
  return true
})

// --- Firestore DEVLOG 상태 ---
const loading = ref(true)
const devlogs = ref([])

/**
 * Firestore 문서 → 로컬 객체 변환
 */
function mapDoc(snapshot) {
  const data = snapshot.data() || {}
  const createdAt = data.createdAt?.toDate?.() ?? null

  return {
    id: snapshot.id,
    title: data.title ?? '',
    type: data.type ?? 'note', // note | patch | sample | todo
    summary: data.summary ?? '',
    status: data.status ?? '',
    version: data.version ?? '',
    createdAt,
  }
}

// 실시간 구독
let unsubscribe = null

onMounted(() => {
  const colRef = collection(db, 'devlogs')
  const q = query(colRef, orderBy('createdAt', 'desc'))

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      devlogs.value = snapshot.docs.map(mapDoc)
      loading.value = false
    },
    (error) => {
      console.error('DEVLOG 구독 오류:', error)
      loading.value = false
    }
  )
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})

// --- 필터 / 검색 ---
const activeType = ref('all') // all | note | patch | sample | todo
const keyword = ref('')

const filteredDevlogs = computed(() => {
  let list = devlogs.value

  if (activeType.value !== 'all') {
    list = list.filter((post) => post.type === activeType.value)
  }

  const k = keyword.value.trim().toLowerCase()
  if (k) {
    list = list.filter((post) => {
      const title = (post.title || '').toLowerCase()
      const summary = (post.summary || '').toLowerCase()
      return title.includes(k) || summary.includes(k)
    })
  }

  return list
})

// --- 새 글 / 수정 공통 상태 ---
const showEditor = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// 수정 중인 DEVLOG id (없으면 새 글 모드)
const editingId = ref(null)
const isEditing = computed(() => !!editingId.value)

const draft = ref({
  title: '',
  type: 'note',
  summary: '',
  status: '',
  version: '',
})

function resetDraft() {
  draft.value = {
    title: '',
    type: 'note',
    summary: '',
    status: '',
    version: '',
  }
  errorMessage.value = ''
}

function exitEditor() {
  resetDraft()
  editingId.value = null
  showEditor.value = false
}

function toggleEditor() {
  if (!showEditor.value) {
    // 새 글 작성 모드로 열기
    editingId.value = null
    resetDraft()
    showEditor.value = true
  } else {
    // 열려 있으면 (새 글이든 수정이든) 닫기
    exitEditor()
  }
}

// 카드에서 "수정" 눌렀을 때
function beginEdit(post) {
  if (!isAdmin.value || !post) return

  editingId.value = post.id
  draft.value = {
    title: post.title || '',
    type: post.type || 'note',
    summary: post.summary || '',
    status: post.status || '',
    version: post.version || '',
  }
  errorMessage.value = ''
  showEditor.value = true
}

// --- 저장 (새 글 / 수정 공통) ---
async function saveDevlog() {
  if (!isAdmin.value) return

  const title = draft.value.title.trim()
  const summary = draft.value.summary.trim()

  if (!title) {
    errorMessage.value = '제목을 입력해 주세요.'
    return
  }

  if (!summary) {
    errorMessage.value = '요약(내용)을 간단히라도 입력해 주세요.'
    return
  }

  errorMessage.value = ''
  saving.value = true

  try {
    const u = user.value

    if (editingId.value) {
      // 수정 모드: updateDoc
      const docRef = doc(db, 'devlogs', editingId.value)
      await updateDoc(docRef, {
        title,
        summary,
        type: draft.value.type || 'note',
        status: draft.value.status.trim() || '',
        version: draft.value.version.trim() || '',
        updatedAt: serverTimestamp(),
      })
    } else {
      // 새 글 작성: addDoc
      const colRef = collection(db, 'devlogs')
      await addDoc(colRef, {
        title,
        summary,
        type: draft.value.type || 'note',
        status: draft.value.status.trim() || '',
        version: draft.value.version.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorEmail: u?.email ?? null,
        authorName: u?.displayName ?? null,
        visibility: 'internal', // 필요시 향후 'public' 등으로 확장
      })
    }

    exitEditor()
  } catch (err) {
    console.error('DEVLOG 저장 실패:', err)
    errorMessage.value = 'DEVLOG 저장 중 오류가 발생했습니다. 콘솔을 확인해 주세요.'
  } finally {
    saving.value = false
  }
}

// --- 삭제 ---
async function deleteDevlog(id) {
  if (!isAdmin.value || !id) return

  const ok = window.confirm('정말 이 DEVLOG를 삭제할까요? 이 작업은 되돌릴 수 없어요.')
  if (!ok) return

  try {
    const docRef = doc(db, 'devlogs', id)
    await deleteDoc(docRef)

    // 만약 삭제한 글을 수정 중이었다면 에디터 초기화
    if (editingId.value === id) {
      exitEditor()
    }
  } catch (err) {
    console.error('DEVLOG 삭제 실패:', err)
    // 필요하면 여기서도 별도 에러 메시지 상태 만들어서 화면에 표시 가능
  }
}

// --- 표시용 유틸 함수 ---
function typeLabel(type) {
  switch (type) {
    case 'note':
      return '일반 메모'
    case 'patch':
      return '패치 노트'
    case 'sample':
      return '실험 · 샘플'
    case 'todo':
      return 'TODO / 계획'
    default:
      return '기타'
  }
}

function tagClass(type) {
  switch (type) {
    case 'note':
      return 'tag-type-note'
    case 'patch':
      return 'tag-type-patch'
    case 'sample':
      return 'tag-type-sample'
    case 'todo':
      return 'tag-type-todo'
    default:
      return ''
  }
}

function formatDate(date) {
  if (!date || !(date instanceof Date)) return ''
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<style scoped>
.devlog-root {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 상단 헤더 */

.devlog-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(248, 250, 252, 0.4);
  background: rgba(15, 23, 42, 0.95);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.header-subtitle {
  font-size: 0.82rem;
  line-height: 1.6;
  opacity: 0.9;
}

.header-side {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: radial-gradient(
    circle at top left,
    rgba(96, 165, 250, 0.18),
    rgba(15, 23, 42, 0.98)
  );
  padding: 10px 12px;
}

.side-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.side-list {
  font-size: 0.78rem;
  line-height: 1.6;
  padding-left: 16px;
  opacity: 0.95;
}

/* 메인 레이아웃 */

.devlog-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 왼쪽 영역 */

.devlog-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.devlog-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tab-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  font-size: 0.76rem;
  color: #e5e7eb;
  cursor: pointer;
}

.tab-button.active {
  background: rgba(96, 165, 250, 0.38);
  border-color: rgba(96, 165, 250, 0.9);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
}

.search-icon {
  font-size: 0.8rem;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.78rem;
  color: #e5e7eb;
}

.search-input::placeholder {
  color: rgba(148, 163, 184, 0.7);
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.primary-button {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.9);
  color: #e5e7eb;
  font-size: 0.78rem;
  cursor: pointer;
}

.primary-button--disabled {
  border-color: rgba(148, 163, 184, 0.7);
  background: rgba(30, 41, 59, 0.9);
  cursor: default;
  opacity: 0.7;
}

/* 새 글 / 수정 폼 */

.devlog-editor {
  margin-top: 4px;
  margin-bottom: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.8);
  background: rgba(15, 23, 42, 0.96);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.editor-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-row--two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}

.editor-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
}

.editor-input,
.editor-select,
.editor-textarea {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.9);
  padding: 6px 8px;
  font-size: 0.8rem;
  color: #e5e7eb;
  outline: none;
}

.editor-input:focus,
.editor-select:focus,
.editor-textarea:focus {
  border-color: rgba(96, 165, 250, 0.9);
}

.editor-textarea {
  resize: vertical;
  min-height: 72px;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.editor-error {
  font-size: 0.76rem;
  color: #fca5a5;
}

/* DEVLOG 리스트 */

.devlog-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.devlog-empty {
  font-size: 0.8rem;
  opacity: 0.85;
}

.devlog-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(15, 23, 42, 0.96);
  padding: 10px 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  flex: 1;
}

.card-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  white-space: nowrap;
}

.tag-type-note {
  border-color: rgba(96, 165, 250, 0.9);
}

.tag-type-patch {
  border-color: rgba(52, 211, 153, 0.9);
}

.tag-type-sample {
  border-color: rgba(244, 114, 182, 0.9);
}

.tag-type-todo {
  border-color: rgba(250, 204, 21, 0.9);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.72rem;
  opacity: 0.75;
  margin-bottom: 4px;
}

.meta-separator {
  opacity: 0.4;
}

/* ★ 여기 줄바꿈 반영 추가 */
.card-summary {
  font-size: 0.8rem;
  line-height: 1.6;
  opacity: 0.92;
  white-space: pre-line; /* 줄바꿈(\n) 유지해서 표시 */
}

/* 카드 푸터 (수정 / 삭제 버튼) */

.card-footer {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.card-edit {
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.85);
  background: rgba(15, 23, 42, 0.9);
  color: #dbeafe;
  cursor: pointer;
}

.card-delete {
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.85);
  background: rgba(30, 41, 59, 0.9);
  color: #fecaca;
  cursor: pointer;
}

/* 오른쪽 사이드 영역 */

.devlog-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(15, 23, 42, 0.98);
  padding: 10px 12px;
}

.side-card-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.side-card-list {
  font-size: 0.78rem;
  line-height: 1.6;
  padding-left: 16px;
  opacity: 0.95;
}

/* 반응형 */

@media (min-width: 900px) {
  .devlog-header {
    flex-direction: row;
    align-items: flex-start;
  }

  .header-main {
    flex: 2;
  }

  .header-side {
    flex: 1.2;
  }

  .devlog-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .devlog-main {
    flex: 2;
  }

  .devlog-side {
    flex: 1.1;
  }
}
</style>
