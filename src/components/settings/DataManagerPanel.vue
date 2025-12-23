<!-- src/components/settings/DataManagerPanel.vue -->
<template>
  <div class="data-manager">
    <header class="header">
      <div>
        <h1 class="title">데이터 관리</h1>
        <p class="desc">
          저장된 자료를 확인하고, 원할 경우 삭제하여 처음 상태로 되돌릴 수 있습니다.
        </p>
      </div>
    </header>

    <section class="card">
      <h2 class="card-title">저장 정보</h2>

      <div class="kv">
        <div class="k">로그인 상태</div>
        <div class="v">{{ uid ? '로그인됨' : '비로그인(게스트)' }}</div>
      </div>

      <div class="kv">
        <div class="k">원격 저장</div>
        <div class="v">
          {{ remoteOk ? '가능(PROD)' : '비활성(DEV 정책)' }}
        </div>
      </div>

      <div class="kv">
        <div class="k">월드</div>
        <div class="v">{{ world === 'dev' ? 'DEV' : 'PROD' }}</div>
      </div>

      <p class="hint" v-if="!uid">
        Firestore 저장자료 확인/삭제는 로그인 상태에서만 가능합니다.
      </p>

      <p class="hint" v-else-if="uid && !remoteOk">
        DEV에서는 원격 저장이 차단되어 있어 계정 자료 불러오기/삭제를 할 수 없습니다.
      </p>
    </section>

    <section class="card">
      <h2 class="card-title">저장 데이터</h2>

      <div class="row">
        <button class="btn" @click="saveNowFromUi" :disabled="!uid || !remoteOk || loading || saving">
          저장하기
        </button>

        <button class="btn" @click="loadResearchDoc" :disabled="!uid || !remoteOk || loading">
          저장자료 불러오기
        </button>

        <button class="btn danger" @click="openDeleteModal" :disabled="!uid || !remoteOk || loading">
          저장자료 삭제
        </button>
      </div>

      <div class="autosave">
        <div class="autosave-title">자동저장</div>

        <div class="autosave-controls">
          <label class="radio">
            <input
              type="radio"
              name="autosave"
              :value="'off'"
              v-model="autoSaveMode"
              :disabled="!uid || !remoteOk || loading"
            />
            <span>안함</span>
          </label>

          <label class="radio">
            <input
              type="radio"
              name="autosave"
              :value="'5'"
              v-model="autoSaveMode"
              :disabled="!uid || !remoteOk || loading"
            />
            <span>5분</span>
          </label>

          <label class="radio">
            <input
              type="radio"
              name="autosave"
              :value="'10'"
              v-model="autoSaveMode"
              :disabled="!uid || !remoteOk || loading"
            />
            <span>10분</span>
          </label>
        </div>

        <p class="hint" v-if="uid && remoteOk && autoSaveEnabled && autoSaveRunning">
          자동저장 동작 중 (KST 분 경계 기준)
        </p>
      </div>

      <p v-if="message" class="message">{{ message }}</p>

      <div v-if="docLoaded" class="preview">
        <div class="preview-head">
          <h3 class="preview-title">너의 계정엔 이러한게 저장되어 있어</h3>
          <button class="btn small" @click="expanded = !expanded">
            {{ expanded ? '접기' : '펼치기' }}
          </button>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-k">버전</div>
            <div class="summary-v">{{ docData?.version ?? '-' }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-k">저장된 항목 수(legacy)</div>
            <div class="summary-v">{{ docData?.transports?.length ?? 0 }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-k">업데이트</div>
            <div class="summary-v">{{ formatUpdatedAt(docData?.updatedAt) }}</div>
          </div>
        </div>

        <pre v-if="expanded" class="pre">{{ pretty(docData) }}</pre>
      </div>

      <p v-else class="hint">아직 불러온 데이터가 없습니다.</p>
    </section>

    <div v-if="deleteModalOpen" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal">
        <h2 class="modal-title">정말 삭제하시겠습니까?</h2>

        <p class="modal-desc danger-text">
          지우면 그동안 작업한것이 전부 지워집니다. 정말 지우실건가요?
        </p>

        <p class="modal-desc">
          삭제하면 해당내용은 지워지고, 이후에는 <b>처음부터 세팅</b>됩니다.
        </p>

        <label class="check">
          <input type="checkbox" v-model="checkedUnderstand" />
          <span>이 작업은 되돌릴 수 없다는 것을 이해했습니다.</span>
        </label>

        <p class="modal-desc">
          계속하려면 아래에 <b>DELETE</b>를 입력하세요.
        </p>

        <input class="input" v-model="confirmText" placeholder="DELETE" />

        <div class="row">
          <button class="btn" @click="closeDeleteModal" :disabled="loading">취소</button>
          <button
            class="btn danger"
            @click="deleteResearchDoc"
            :disabled="loading || !checkedUnderstand || confirmText !== 'DELETE'"
          >
            영구 삭제
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db, REMOTE_ENABLED } from '@/plugins/firebase/config'
import { useAuth } from '@/composables/useAuth'
import { useResearch } from '@/composables/useResearch'
import { useWorld } from '@/composables/useWorld'

// world
const { world } = useWorld()

// ✅ DEV 정책: 원격은 PROD에서만 허용
const remoteOk = computed(() => import.meta.env.PROD && !!REMOTE_ENABLED && !!db)

// uid
const auth = useAuth()
const uid = computed(() => auth?.user?.value?.uid ?? null)

// research API
const {
  saveNow,
  isSavingFirebaseData,
  autoSaveEnabled,
  autoSaveBase,
  autoSaveIntervalMin,
  setAutoSaveEnabled,
  setAutoSaveBase,
  setAutoSaveIntervalMin,
  autoSaveRunning,
} = useResearch()

const saving = computed(() => isSavingFirebaseData.value)

const loading = ref(false)
const message = ref('')
const docLoaded = ref(false)
const docData = ref(null)
const expanded = ref(false)

function pretty(v) {
  return JSON.stringify(v, null, 2)
}
function formatUpdatedAt(v) {
  if (!v) return '-'
  try {
    if (typeof v?.toDate === 'function') return v.toDate().toLocaleString()
    if (v instanceof Date) return v.toLocaleString()
    if (typeof v === 'number') return new Date(v).toLocaleString()
    return String(v)
  } catch {
    return String(v)
  }
}

// ✅ world 경로로 통일 (useResearch와 동일)
function normalizeWorld(w) {
  return String(w || '').toLowerCase() === 'dev' ? 'dev' : 'prod'
}
function researchDocRef(uidValue, worldValue) {
  if (!remoteOk.value) return null
  const ww = normalizeWorld(worldValue)
  return doc(db, 'worlds', ww, 'users', uidValue, 'research', 'state')
}

// ===== 자동저장 UI 모드 =====
const autoSaveMode = ref('off')

function syncModeFromState() {
  if (!autoSaveEnabled.value) {
    autoSaveMode.value = 'off'
    return
  }
  const base = Number(autoSaveBase.value)
  const interval = Number(autoSaveIntervalMin.value)

  if (base === 10 && interval === 10) autoSaveMode.value = '10'
  else if (base === 5 && interval === 5) autoSaveMode.value = '5'
  else if (base === 10) autoSaveMode.value = '10'
  else autoSaveMode.value = '5'
}

watch([autoSaveEnabled, autoSaveBase, autoSaveIntervalMin], () => syncModeFromState(), { immediate: true })

watch(autoSaveMode, (v) => {
  if (!uid.value) return
  if (!remoteOk.value) return

  if (v === 'off') {
    setAutoSaveEnabled(false)
    return
  }

  if (v === '5') {
    setAutoSaveBase(5)
    setAutoSaveIntervalMin(5)
    setAutoSaveEnabled(true)
    return
  }

  if (v === '10') {
    setAutoSaveBase(10)
    setAutoSaveIntervalMin(10)
    setAutoSaveEnabled(true)
  }
})

// 수동 저장
async function saveNowFromUi() {
  if (!uid.value) return
  if (!remoteOk.value) {
    message.value = 'DEV에서는 원격 저장이 비활성입니다.'
    return
  }

  message.value = ''
  try {
    await saveNow({ reason: 'manual-ui' })
    message.value = '저장 완료.'
  } catch (e) {
    console.error('DataManager: save failed', e)
    message.value = `저장 실패: ${String(e?.message ?? e)}`
  }
}

async function loadResearchDoc() {
  if (!uid.value) return

  // ✅ 핵심: db null 방지
  if (!remoteOk.value) {
    message.value = 'DEV에서는 원격 불러오기가 비활성입니다.'
    return
  }

  loading.value = true
  message.value = ''
  docLoaded.value = false
  docData.value = null
  expanded.value = false

  try {
    const refDoc = researchDocRef(uid.value, world.value)
    if (!refDoc) throw new Error('REMOTE_DISABLED')

    const snap = await getDoc(refDoc)

    if (snap.exists()) {
      docData.value = snap.data()
      docLoaded.value = true
      message.value = '저장된 자료를 불러왔습니다.'
    } else {
      message.value = '저장된 문서가 없습니다. (초기 상태)'
    }
  } catch (e) {
    console.error('DataManager: load failed', e)
    message.value = `불러오기 실패: ${String(e?.message ?? e)}`
  } finally {
    loading.value = false
  }
}

// 삭제 모달
const deleteModalOpen = ref(false)
const checkedUnderstand = ref(false)
const confirmText = ref('')

function openDeleteModal() {
  if (!remoteOk.value) {
    message.value = 'DEV에서는 원격 삭제가 비활성입니다.'
    return
  }
  deleteModalOpen.value = true
  checkedUnderstand.value = false
  confirmText.value = ''
}
function closeDeleteModal() {
  deleteModalOpen.value = false
}

async function deleteResearchDoc() {
  if (!uid.value) return
  if (!remoteOk.value) {
    message.value = 'DEV에서는 원격 삭제가 비활성입니다.'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const refDoc = researchDocRef(uid.value, world.value)
    if (!refDoc) throw new Error('REMOTE_DISABLED')

    await deleteDoc(refDoc)

    docLoaded.value = false
    docData.value = null
    expanded.value = false

    message.value = '삭제 완료. 이제 처음부터 세팅됩니다.'
    closeDeleteModal()
  } catch (e) {
    console.error('DataManager: delete failed', e)
    message.value = `삭제 실패: ${String(e?.message ?? e)}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.data-manager,
.data-manager * { box-sizing: border-box; }

.data-manager { padding: 16px; }

.title { margin: 0 0 6px; font-size: 20px; font-weight: 800; }
.desc { margin: 0; opacity: 0.85; line-height: 1.35; }

.card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
}
.card-title { margin: 0 0 10px; font-size: 15px; opacity: 0.95; font-weight: 800; }

.kv {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  padding: 8px 0;
}
.k { opacity: 0.75; white-space: nowrap; }
.v { word-break: break-word; }

.row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }

.btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.18);
  background: transparent;
  cursor: pointer;
  color: #ffffff;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.small { padding: 8px 10px; font-size: 12px; opacity: 0.9; }
.btn.danger { border-color: rgba(255, 90, 90, 0.65); color: #ffb3b3; }

.message { margin-top: 10px; opacity: 0.9; }
.hint { margin-top: 10px; opacity: 0.75; }

.preview { margin-top: 12px; }
.preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.preview-title { margin: 0; font-size: 14px; opacity: 0.92; font-weight: 800; }

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.summary-item { border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 10px; }
.summary-k { font-size: 12px; opacity: 0.7; }
.summary-v { margin-top: 6px; font-size: 14px; font-weight: 800; word-break: break-word; }

.pre {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  max-height: 320px;
  overflow: auto;
}

.autosave {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.10);
}
.autosave-title { font-size: 13px; opacity: 0.9; margin-bottom: 8px; font-weight: 800; }
.autosave-controls { display: flex; gap: 14px; flex-wrap: wrap; }
.radio { display: inline-flex; align-items: center; gap: 8px; user-select: none; opacity: 0.95; }

.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: grid; place-items: center;
  z-index: 9999;
}
.modal {
  width: min(560px, 92vw);
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(10,10,12,0.96);
  overflow: hidden;
}
.modal-title { margin: 0 0 8px; font-weight: 900; }
.modal-desc { margin: 8px 0; opacity: 0.9; line-height: 1.35; }
.danger-text { color: rgba(255,120,120,0.95); }

.check { display: flex; gap: 10px; align-items: flex-start; margin: 10px 0; }

.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06);
  color: #ffffff;
  caret-color: #ffffff;
}
.input::placeholder { color: rgba(255,255,255,0.45); }
.input:focus { outline: none; border-color: rgba(255,255,255,0.35); }

@media (max-width: 520px) {
  .data-manager { padding: 12px; }
  .kv { grid-template-columns: 88px 1fr; gap: 10px; }
  .summary { grid-template-columns: 1fr; }
  .row .btn { flex: 1; }
}
</style>
