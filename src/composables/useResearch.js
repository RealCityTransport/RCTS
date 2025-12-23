// src/composables/useResearch.js
import { ref, computed, watchEffect } from 'vue'
import { db, REMOTE_ENABLED } from '@/plugins/firebase/config'
import { useKstTime } from './useKstTime'

import { researchCatalog, getResearchDef } from '@/data/research/catalog'
import { useTimeFormat } from '@/composables/useTimeFormat'
import { useDeployChannel } from '@/composables/useDeployChannel'

// 저장/자동저장 설정 (LocalStorage)
const LS_SAVE_ENABLED = 'rcts.research.saveEnabled'
const LS_AUTOSAVE_ENABLED = 'rcts.research.autosave.enabled'
const LS_AUTOSAVE_BASE = 'rcts.research.autosave.base'
const LS_AUTOSAVE_INTERVAL = 'rcts.research.autosave.intervalMin'

const { kstDate, isKstTimeReady } = useKstTime()
const isKstReady = computed(() => isKstTimeReady.value && kstDate.value instanceof Date)

function nowKstMs() {
  return isKstReady.value ? kstDate.value.getTime() : Date.now()
}

// =======================================================
// ✅ 긴급 잠금(실서비스 핫픽스)
// =======================================================
const HARD_LOCK_RESEARCH_IDS = new Set([
  'sys_unlock_vehicle',
  'sys_unlock_route',
  'sys_unlock_construction',
  'sys_unlock_finance',
  'sys_unlock_city',
])

function isHardLockedResearchId(id) {
  if (!id) return false
  if (!HARD_LOCK_RESEARCH_IDS.has(id)) return false
  const def = getResearchDef(id)
  return def?.enabled === false
}

// ===== 월드(본세계/개발세계) =====
// ✅ 채널 확장 대비: dev/prod/stage/test 등 문자열 그대로 허용
function normalizeWorld(w) {
  const x = String(w || '').toLowerCase().trim()
  if (!x) return 'prod'
  return x
}

// -------------------------------------------------------
// ✅ 채널 정책
// -------------------------------------------------------
const { isTest } = useDeployChannel()

// ✅ 정책: test 채널에서는 원격 저장/불러오기/구독을 무조건 막는다.
const REMOTE_OK = computed(() => {
  if (isTest.value) return false
  return !!REMOTE_ENABLED && !!db
})

// ✅ 테스트서버: 모든 연구 5분 고정 (env 또는 채널)
const FORCE_ALL_5MIN = computed(() => {
  const v = (import.meta.env.VITE_RESEARCH_ALL_5MIN ?? 'false') === 'true'
  return v || isTest.value
})
const FORCE_ALL_5MIN_SEC = 300

// -------------------------------------------------------
// ✅ Firestore 동적 로딩 래퍼
// -------------------------------------------------------
let _fs = null
async function ensureFs() {
  if (!REMOTE_OK.value) return null
  if (_fs) return _fs

  const m = await import('firebase/firestore')
  _fs = {
    doc: m.doc,
    getDoc: m.getDoc,
    setDoc: m.setDoc,
    serverTimestamp: m.serverTimestamp,
    onSnapshot: m.onSnapshot,
  }
  return _fs
}

async function safeDoc(...args) {
  const fs = await ensureFs()
  if (!fs) return null
  return fs.doc(...args)
}

async function safeGetDoc(refDoc) {
  const fs = await ensureFs()
  if (!fs || !refDoc) return null
  return fs.getDoc(refDoc)
}

async function safeSetDoc(refDoc, payload, opts) {
  const fs = await ensureFs()
  if (!fs || !refDoc) return false
  await fs.setDoc(refDoc, payload, opts)
  return true
}

async function safeOnSnapshot(refDoc, onNext, onErr) {
  const fs = await ensureFs()
  if (!fs || !refDoc) return null
  return fs.onSnapshot(refDoc, onNext, onErr)
}

async function safeServerTimestamp() {
  const fs = await ensureFs()
  if (!fs) return null
  return fs.serverTimestamp()
}

// -------------------------------------------------------

async function researchDocRef(uid, world) {
  if (!REMOTE_OK.value) return null
  const ww = normalizeWorld(world)
  return safeDoc(db, 'worlds', ww, 'users', uid, 'research', 'state')
}

async function legacyResearchDocRef(uid) {
  if (!REMOTE_OK.value) return null
  return safeDoc(db, 'users', uid, 'research', 'state')
}

// ===== 전역 상태(싱글톤) =====
const firstUnlockTransportId = ref(null)
const completedIds = ref(new Set())
const activeResearch = ref(null) // { id, startedAtMs, endsAtMs }
const queuedResearchIds = ref([])

const unlockedTransportTiers = ref({})
const incomeMultiplier = ref(1.0)

const researchSpeedLevel = ref(0)
const researchDurationMultiplier = ref(1.0)

const queueReserveLevel = ref(1)
const cityScale = ref('NONE')

const unlockedFeatures = ref({
  vehicle: false,
  route: false,
  construction: false,
  finance: false,
  city: false,
})

// Firebase 연동 상태
const isLoadingFirebaseData = ref(false)
const isSavingFirebaseData = ref(false)
const isStateLoaded = ref(false)
const currentUid = ref(null)
const currentWorld = ref((import.meta.env.VITE_WORLD ?? 'prod'))

let saveDebounceTimer = null
let isHydrating = false
let unsubscribeFn = null

// 저장 ON/OFF (의미를 "자동/배경 저장 허용"으로 축소)
const saveEnabled = ref(loadBool(LS_SAVE_ENABLED, true))

// 자동 저장 설정
const autoSaveEnabled = ref(loadBool(LS_AUTOSAVE_ENABLED, false))
const autoSaveBase = ref(loadNum(LS_AUTOSAVE_BASE, 5))
const autoSaveIntervalMin = ref(loadNum(LS_AUTOSAVE_INTERVAL, 10))

// 자동 저장 상태 표시용
const autoSaveRunning = ref(false)
const lastAutoSaveAtMs = ref(0)
let autoSaveTimerId = null

// ===== Helpers (LocalStorage settings only) =====
function loadBool(key, def) {
  const v = localStorage.getItem(key)
  if (v === null) return def
  return v === '1'
}
function loadNum(key, def) {
  const v = localStorage.getItem(key)
  const n = v == null ? NaN : Number(v)
  return Number.isFinite(n) ? n : def
}
function saveBool(key, value) {
  localStorage.setItem(key, value ? '1' : '0')
}
function saveNum(key, value) {
  localStorage.setItem(key, String(value))
}

// ===== 예약 슬롯 계산 =====
function queueLimitByLevel(level) {
  const lv = Math.max(1, Math.min(3, Number(level || 1)))
  if (lv === 1) return 1
  if (lv === 2) return 3
  return 5
}

// ===== 저장 토글 =====
function setSaveEnabled(v) {
  saveEnabled.value = !!v
  saveBool(LS_SAVE_ENABLED, saveEnabled.value)

  if (!saveEnabled.value) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
      saveDebounceTimer = null
    }
    stopAutoSave()
  } else {
    syncAutoSave()
  }
}

function setAutoSaveEnabled(v) {
  autoSaveEnabled.value = !!v
  saveBool(LS_AUTOSAVE_ENABLED, autoSaveEnabled.value)
  syncAutoSave()
}

function setAutoSaveBase(v) {
  const base = Number(v) === 10 ? 10 : 5
  autoSaveBase.value = base
  saveNum(LS_AUTOSAVE_BASE, base)

  const cur = Number(autoSaveIntervalMin.value) || base
  const fixed = Math.max(base, Math.round(cur / base) * base)
  autoSaveIntervalMin.value = fixed
  saveNum(LS_AUTOSAVE_INTERVAL, fixed)

  syncAutoSave(true)
}

function setAutoSaveIntervalMin(v) {
  const base = Number(autoSaveBase.value) === 10 ? 10 : 5
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return

  const fixed = Math.max(base, Math.round(n / base) * base)
  autoSaveIntervalMin.value = fixed
  saveNum(LS_AUTOSAVE_INTERVAL, fixed)

  syncAutoSave(true)
}

// ===== KST 경계 자동저장 =====
function calcDelayToNextKstBoundaryMs(intervalMin) {
  const interval = Number(intervalMin)
  if (!Number.isFinite(interval) || interval <= 0) return 60_000

  const intervalMs = interval * 60 * 1000
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000
  const kstNow = Date.now() + KST_OFFSET_MS

  const next = (Math.floor(kstNow / intervalMs) + 1) * intervalMs
  const delay = next - kstNow

  return Math.max(1000, delay)
}

function stopAutoSave() {
  autoSaveRunning.value = false
  if (autoSaveTimerId) {
    clearTimeout(autoSaveTimerId)
    autoSaveTimerId = null
  }
}

function scheduleNextAutoSave() {
  if (autoSaveTimerId) {
    clearTimeout(autoSaveTimerId)
    autoSaveTimerId = null
  }

  if (!REMOTE_OK.value) return stopAutoSave()
  if (!autoSaveEnabled.value) return stopAutoSave()
  if (!saveEnabled.value) return stopAutoSave()
  if (!currentUid.value) return stopAutoSave()
  if (!isStateLoaded.value) return stopAutoSave()
  if (isHydrating) return stopAutoSave()

  autoSaveRunning.value = true

  const interval = Number(autoSaveIntervalMin.value) || 10
  const delay = calcDelayToNextKstBoundaryMs(interval)

  autoSaveTimerId = setTimeout(async () => {
    try {
      await saveNow({ reason: 'autosave' })
      lastAutoSaveAtMs.value = Date.now()
    } catch (e) {
      console.error('useResearch: 자동저장 실패:', e)
    } finally {
      scheduleNextAutoSave()
    }
  }, delay)
}

function syncAutoSave(restart = false) {
  if (restart) stopAutoSave()
  if (!REMOTE_OK.value) return stopAutoSave()

  if (
    autoSaveEnabled.value &&
    saveEnabled.value &&
    currentUid.value &&
    isStateLoaded.value &&
    !isHydrating
  ) {
    scheduleNextAutoSave()
  } else {
    stopAutoSave()
  }
}

// ===== 게스트 전환(로그아웃 포함) =====
function becomeGuestMode() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
    saveDebounceTimer = null
  }
  stopAutoSave()

  currentUid.value = null
  currentWorld.value = (import.meta.env.VITE_WORLD ?? 'prod')
  isStateLoaded.value = false
  isHydrating = false
}

// ===== 카탈로그 해석 =====
function prerequisitesMet(def) {
  const reqs = Array.isArray(def?.requires) ? def.requires : []
  return reqs.every((rid) => completedIds.value.has(rid))
}

function revealSatisfied(def) {
  const reveal = Array.isArray(def?.revealAfter) ? def.revealAfter : []
  if (reveal.length === 0) return true
  return reveal.every((rid) => completedIds.value.has(rid))
}

function isCompleted(id) {
  return completedIds.value.has(id)
}

function isTier1TransportUnlock(def) {
  if (!def) return false
  if (Number(def.tier || 1) !== 1) return false
  return (def.effects || []).some(
    (e) => e?.type === 'UNLOCK_TRANSPORT_TIER' && Number(e?.tier || 1) === 1 && !!e?.transportId
  )
}

function isSystemFixedResearch(def) {
  if (!def) return false
  if (def.timePolicy === 'FIXED') return true
  return def.type === 'SYSTEM'
}

function cityScaleRank(scale) {
  switch (String(scale || '').toUpperCase()) {
    case 'REGION': return 1
    case 'CITY': return 2
    case 'COUNTRY': return 3
    case 'STATE': return 4
    case 'PLANET': return 5
    default: return 0
  }
}

function recomputeEffects() {
  const tiers = {}
  let mult = 1.0

  let rsLevel = 0
  let reserveLv = 1
  let nextCityScale = 'NONE'

  const features = {
    vehicle: false,
    route: false,
    construction: false,
    finance: false,
    city: false,
  }

  for (const node of researchCatalog) {
    if (!completedIds.value.has(node.id)) continue

    for (const eff of node.effects || []) {
      if (eff.type === 'UNLOCK_TRANSPORT_TIER') {
        const tid = eff.transportId
        const t = Number(eff.tier || 1)
        if (!tid) continue
        tiers[tid] = Math.max(Number(tiers[tid] || 0), t)
      }

      if (eff.type === 'INCOME_MULTIPLIER') {
        mult *= Number(eff.value || 1.0)
      }

      if (eff.type === 'RESEARCH_SPEED_LEVEL') {
        const lv = Number(eff.level || 0)
        if (Number.isFinite(lv)) rsLevel = Math.max(rsLevel, lv)
      }

      if (eff.type === 'QUEUE_RESERVE_LEVEL') {
        const lv = Number(eff.level || 1)
        if (Number.isFinite(lv)) reserveLv = Math.max(reserveLv, lv)
      }

      if (eff.type === 'UNLOCK_FEATURE') {
        const k = String(eff.featureKey || '')
        if (k && Object.prototype.hasOwnProperty.call(features, k)) {
          features[k] = true
        }
      }

      if (eff.type === 'SET_CITY_SCALE') {
        const s = String(eff.scale || '').toUpperCase()
        if (cityScaleRank(s) > cityScaleRank(nextCityScale)) nextCityScale = s
      }
    }
  }

  unlockedTransportTiers.value = tiers
  incomeMultiplier.value = mult

  researchSpeedLevel.value = rsLevel
  const raw = 1 - 0.05 * Math.max(0, rsLevel)
  researchDurationMultiplier.value = Math.max(0.2, raw)

  cityScale.value = nextCityScale
  unlockedFeatures.value = features

  queueReserveLevel.value = Math.max(1, Math.min(3, reserveLv))

  const limit = queueLimitByLevel(queueReserveLevel.value)
  if (queuedResearchIds.value.length > limit) {
    queuedResearchIds.value = queuedResearchIds.value.slice(0, limit)
  }
}

const visibleCatalog = computed(() => {
  return researchCatalog.filter((def) => {
    const tier = Number(def?.tier || 1)
    if (tier >= 2) return true
    return revealSatisfied(def)
  })
})

const transportIdsTier1 = computed(() => {
  const set = new Set()
  for (const r of researchCatalog) {
    if (Number(r.tier || 1) !== 1) continue
    for (const e of r.effects || []) {
      if (e.type === 'UNLOCK_TRANSPORT_TIER' && Number(e.tier || 1) === 1 && e.transportId) {
        set.add(e.transportId)
      }
    }
  }
  return Array.from(set)
})

const needsFirstUnlockSelection = computed(() => !firstUnlockTransportId.value)
const firstUnlockCandidates = computed(() => transportIdsTier1.value.map((id) => ({ id })))

function hasAnyStarterTransportUnlocked() {
  return (
    completedIds.value.has('unlock_bus_t1') ||
    completedIds.value.has('unlock_truck_t1') ||
    completedIds.value.has('unlock_rail_t1')
  )
}

function getStatus(researchId) {
  const def = getResearchDef(researchId)
  if (!def) return 'unknown'

  const tier = Number(def.tier || 1)
  if (tier === 1 && !revealSatisfied(def)) return 'hidden'

  if (isCompleted(researchId)) return 'done'
  if (activeResearch.value?.id === researchId) return 'active'
  if (queuedResearchIds.value.includes(researchId)) return 'queued'

  if (def.enabled === false) return 'comingSoon'

  if (researchId === 'sys_preview_starter_vehicles') {
    if (!firstUnlockTransportId.value) return 'locked'
    if (!hasAnyStarterTransportUnlocked()) return 'locked'
    return 'available'
  }

  if (tier === 1 && isTier1TransportUnlock(def) && !!firstUnlockTransportId.value) {
    return 'available'
  }

  if (!prerequisitesMet(def)) return 'locked'
  return 'available'
}

function findTier1UnlockResearchId(transportId) {
  const node = researchCatalog.find(
    (r) =>
      r.enabled !== false &&
      Number(r.tier || 1) === 1 &&
      (r.effects || []).some(
        (e) =>
          e.type === 'UNLOCK_TRANSPORT_TIER' &&
          e.transportId === transportId &&
          Number(e.tier || 1) === 1
      )
  )
  return node?.id ?? null
}

function canCommit() {
  if (!REMOTE_OK.value) return false
  if (!currentUid.value) return false
  if (!isStateLoaded.value) return false
  if (isHydrating) return false
  return true
}

function canBackgroundSave() {
  if (!saveEnabled.value) return false
  return canCommit()
}

function serializeState() {
  const limit = queueLimitByLevel(queueReserveLevel.value)

  return {
    version: 10,
    firstUnlockTransportId: firstUnlockTransportId.value ?? null,
    completedResearchIds: Array.from(completedIds.value),
    activeResearch: activeResearch.value
      ? {
          id: activeResearch.value.id,
          startedAtMs: activeResearch.value.startedAtMs,
          endsAtMs: activeResearch.value.endsAtMs,
        }
      : null,
    queuedResearchIds: Array.isArray(queuedResearchIds.value)
      ? queuedResearchIds.value.slice(0, limit)
      : [],
  }
}

function applyRemoteState(remote) {
  firstUnlockTransportId.value =
    typeof remote?.firstUnlockTransportId === 'string'
      ? remote.firstUnlockTransportId
      : (typeof remote?.firstUnlockId === 'string' ? remote.firstUnlockId : null)

  const list = Array.isArray(remote?.completedResearchIds) ? remote.completedResearchIds : []
  completedIds.value = new Set(list.filter((x) => typeof x === 'string'))

  const ar = remote?.activeResearch
  if (ar && typeof ar === 'object' && typeof ar.id === 'string') {
    activeResearch.value = {
      id: ar.id,
      startedAtMs: Number(ar.startedAtMs || 0),
      endsAtMs: Number(ar.endsAtMs || 0),
    }
  } else {
    activeResearch.value = null
  }

  const qArr = Array.isArray(remote?.queuedResearchIds)
    ? remote.queuedResearchIds.filter((x) => typeof x === 'string')
    : []

  const legacyQ = typeof remote?.queuedResearchId === 'string' ? remote.queuedResearchId : null

  const merged = []
  for (const id of qArr) {
    if (!merged.includes(id)) merged.push(id)
  }
  if (legacyQ && !merged.includes(legacyQ)) merged.push(legacyQ)

  queuedResearchIds.value = merged

  // legacy migration hook
  if (completedIds.value.size === 0 && Array.isArray(remote?.transports)) {
    for (const t of remote.transports) {
      if (!t || typeof t.id !== 'string') continue
      if (t.locked === false) {
        const rid = findTier1UnlockResearchId(t.id)
        if (rid) completedIds.value.add(rid)
      }
    }
  }

  recomputeEffects()
}

async function saveNow({ reason = 'manual' } = {}) {
  if (!canCommit()) return

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
    saveDebounceTimer = null
  }

  const refDoc = await researchDocRef(currentUid.value, currentWorld.value)
  if (!refDoc) return

  try {
    isSavingFirebaseData.value = true

    const ts = await safeServerTimestamp()
    const payload = {
      ...serializeState(),
      updatedAt: ts,
      lastSaveReason: reason,
    }

    await safeSetDoc(refDoc, payload, { merge: true })
  } catch (e) {
    console.error('useResearch: Firebase 저장 실패:', e)
  } finally {
    isSavingFirebaseData.value = false
  }
}

const scheduleSave = () => {
  if (!canBackgroundSave()) return

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(async () => {
    await saveNow({ reason: 'debounced' })
  }, 800)
}

function setFirstUnlockTransport(transportId) {
  if (!transportId) return
  if (firstUnlockTransportId.value) return

  const researchId = findTier1UnlockResearchId(transportId)
  if (!researchId) return

  firstUnlockTransportId.value = transportId
  completedIds.value.add(researchId)

  recomputeEffects()
  saveNow({ reason: 'firstUnlock' })
}

function startResearchInternal(researchId) {
  if (isHardLockedResearchId(researchId)) return { ok: false, reason: 'COMING_SOON' }

  const def = getResearchDef(researchId)
  if (!def) return { ok: false, reason: 'UNKNOWN_RESEARCH' }

  if (!firstUnlockTransportId.value) return { ok: false, reason: 'FIRST_UNLOCK_REQUIRED' }
  if (!isKstReady.value) return { ok: false, reason: 'KST_NOT_READY' }

  if (isCompleted(researchId)) return { ok: false, reason: 'ALREADY_DONE' }
  if (def.enabled === false) return { ok: false, reason: 'COMING_SOON' }

  const st = getStatus(researchId)
  if (st !== 'available') return { ok: false, reason: st.toUpperCase() }

  const now = nowKstMs()
  const baseSec = Number(def.durationSec || 0)

  let durSec = 0
  if (baseSec > 0) {
    // ✅ 테스트서버/강제옵션: 모든 연구를 5분으로 고정
    if (FORCE_ALL_5MIN.value) {
      durSec = FORCE_ALL_5MIN_SEC
    } else if (isSystemFixedResearch(def)) {
      durSec = Math.ceil(baseSec)
    } else {
      durSec = Math.ceil(baseSec * researchDurationMultiplier.value)
    }
  }

  // 0초 연구는 "즉시완료" 유지(테스트서버에서도 0은 0으로 두는 게 자연스러움)
  if (durSec <= 0) {
    completedIds.value.add(researchId)
    recomputeEffects()
    saveNow({ reason: 'instantComplete' })
    return { ok: true, instant: true }
  }

  activeResearch.value = {
    id: researchId,
    startedAtMs: now,
    endsAtMs: now + durSec * 1000,
  }

  saveNow({ reason: 'startResearch' })
  return { ok: true, instant: false }
}

function startResearch(researchId) {
  if (isHardLockedResearchId(researchId)) return { ok: false, reason: 'COMING_SOON' }

  const limit = queueLimitByLevel(queueReserveLevel.value)

  if (isCompleted(researchId)) return { ok: false, reason: 'ALREADY_DONE' }
  if (activeResearch.value?.id === researchId) return { ok: false, reason: 'ALREADY_ACTIVE' }
  if (queuedResearchIds.value.includes(researchId)) return { ok: true, queued: true, alreadyQueued: true }

  if (activeResearch.value) {
    if (queuedResearchIds.value.length >= limit) return { ok: false, reason: 'QUEUE_FULL' }

    const st = getStatus(researchId)
    if (st !== 'available') return { ok: false, reason: st.toUpperCase() }

    queuedResearchIds.value = [...queuedResearchIds.value, researchId].slice(0, limit)
    saveNow({ reason: 'queueAdd' })
    return { ok: true, queued: true }
  }

  return startResearchInternal(researchId)
}

function cancelQueuedResearch(researchId) {
  const before = queuedResearchIds.value.slice()
  const next = before.filter((id) => id !== researchId)
  if (next.length === before.length) return
  queuedResearchIds.value = next
  saveNow({ reason: 'queueCancel' })
}

function cancelAllQueuedResearch() {
  if (queuedResearchIds.value.length === 0) return
  queuedResearchIds.value = []
  saveNow({ reason: 'queueCancelAll' })
}

function getResearchProgress(researchId) {
  if (!activeResearch.value || activeResearch.value.id !== researchId) return 0
  if (!isKstReady.value) return 0

  const total = activeResearch.value.endsAtMs - activeResearch.value.startedAtMs
  if (total <= 0) return 0

  const elapsed = nowKstMs() - activeResearch.value.startedAtMs
  return Math.max(0, Math.min(100, (elapsed / total) * 100))
}

function getResearchRemainingTime(researchId) {
  const { formatRemainSec } = useTimeFormat()

  if (!activeResearch.value || activeResearch.value.id !== researchId) return '0s'
  if (!isKstReady.value) return '0s'

  const diff = Math.max(0, activeResearch.value.endsAtMs - nowKstMs())
  const s = Math.floor(diff / 1000)
  return formatRemainSec(s)
}

// ==============================
// 서버 정본: 구독 기반 로드 + 레거시 마이그레이션
// ==============================
function unsubscribe() {
  if (unsubscribeFn) {
    unsubscribeFn()
    unsubscribeFn = null
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
    saveDebounceTimer = null
  }
  stopAutoSave()

  currentUid.value = null
  currentWorld.value = (import.meta.env.VITE_WORLD ?? 'prod')
  isStateLoaded.value = false
  isHydrating = false
  isLoadingFirebaseData.value = false
}

async function migrateLegacyToWorldIfNeeded(uid, world) {
  if (!REMOTE_OK.value) return false

  const targetRef = await researchDocRef(uid, world)
  const legacyRef = await legacyResearchDocRef(uid)
  if (!targetRef || !legacyRef) return false

  const legacySnap = await safeGetDoc(legacyRef)
  if (!legacySnap || !legacySnap.exists()) return false

  const legacyData = legacySnap.data() || {}
  const ts = await safeServerTimestamp()

  const payload = {
    ...legacyData,
    migratedFromLegacy: true,
    migratedAt: ts,
    updatedAt: ts,
    lastSaveReason: 'migrateLegacy',
  }

  await safeSetDoc(targetRef, payload, { merge: true })
  return true
}

async function subscribeForUser(uid, world = (import.meta.env.VITE_WORLD ?? 'prod')) {
  if (!uid) return

  unsubscribe()

  currentUid.value = uid
  currentWorld.value = normalizeWorld(world)

  // ✅ test 채널(REMOTE_OK=false)이면 여기서 바로 로컬모드로 완료 처리
  if (!REMOTE_OK.value) {
    recomputeEffects()
    isLoadingFirebaseData.value = false
    isStateLoaded.value = true
    isHydrating = false
    stopAutoSave()
    return
  }

  isLoadingFirebaseData.value = true
  isStateLoaded.value = false

  const refDoc = await researchDocRef(uid, currentWorld.value)
  if (!refDoc) {
    isLoadingFirebaseData.value = false
    isStateLoaded.value = false
    return
  }

  unsubscribeFn = await safeOnSnapshot(
    refDoc,
    async (snap) => {
      isHydrating = true

      try {
        if (snap.exists()) {
          applyRemoteState(snap.data())
        } else {
          const migrated = await migrateLegacyToWorldIfNeeded(uid, currentWorld.value)
          if (!migrated) {
            recomputeEffects()
            const ts = await safeServerTimestamp()
            const payload = {
              ...serializeState(),
              createdAt: ts,
              updatedAt: ts,
              lastSaveReason: 'init',
            }
            await safeSetDoc(refDoc, payload, { merge: true })
          } else {
            recomputeEffects()
          }
        }
      } catch (e) {
        console.error('useResearch: onSnapshot apply failed:', e)
      } finally {
        isHydrating = false
        isLoadingFirebaseData.value = false
        isStateLoaded.value = true
        syncAutoSave(true)
      }
    },
    (err) => {
      isHydrating = false
      isLoadingFirebaseData.value = false
      isStateLoaded.value = false
      stopAutoSave()
      console.error('useResearch: onSnapshot error:', err)
    }
  )
}

// (레거시 호환) 기존 코드가 loadForUser를 부르면 구독으로 연결
async function loadForUser(uid, world = (import.meta.env.VITE_WORLD ?? 'prod')) {
  await subscribeForUser(uid, world)
}

// ===== 사용자 상태 정리 =====
function clearUserState() {
  becomeGuestMode()

  firstUnlockTransportId.value = null
  completedIds.value = new Set()
  activeResearch.value = null
  queuedResearchIds.value = []

  cityScale.value = 'NONE'
  unlockedFeatures.value = {
    vehicle: false,
    route: false,
    construction: false,
    finance: false,
    city: false,
  }

  researchSpeedLevel.value = 0
  researchDurationMultiplier.value = 1.0
  queueReserveLevel.value = 1

  recomputeEffects()
}

// ===== watchEffect (기존 유지) =====
watchEffect(() => {
  if (isHydrating) return

  let changed = false

  if (activeResearch.value?.id && isHardLockedResearchId(activeResearch.value.id)) {
    activeResearch.value = null
    changed = true
  }

  if (Array.isArray(queuedResearchIds.value) && queuedResearchIds.value.length > 0) {
    const filtered = queuedResearchIds.value.filter((id) => !isHardLockedResearchId(id))
    if (filtered.length !== queuedResearchIds.value.length) {
      queuedResearchIds.value = filtered
      changed = true
    }
  }

  if (changed) {
    saveNow({ reason: 'hardLockCleanup' })
  }
})

watchEffect(() => {
  if (!isKstReady.value) return

  const now = nowKstMs()

  if (activeResearch.value && now >= Number(activeResearch.value.endsAtMs || 0)) {
    const doneId = activeResearch.value.id

    activeResearch.value = null
    completedIds.value.add(doneId)

    recomputeEffects()

    if (queuedResearchIds.value.length > 0) {
      const [nextId, ...rest] = queuedResearchIds.value
      queuedResearchIds.value = rest

      const res = startResearchInternal(nextId)
      if (!res?.ok) {
        console.warn('useResearch: queued next start failed:', nextId, res?.reason)
      }
    }

    saveNow({ reason: 'researchComplete' })
  }
})

// ===== Public API =====
export function useResearch() {
  const isHydrated = computed(() => (!currentUid.value) || isStateLoaded.value)

  const queueLimit = computed(() => queueLimitByLevel(queueReserveLevel.value))
  const queueCount = computed(() => queuedResearchIds.value.length)
  const isQueueFull = computed(() => queueCount.value >= queueLimit.value)

  const hasFeature = (key) => !!unlockedFeatures.value?.[key]
  const cityScaleAtLeast = (scale) => cityScaleRank(cityScale.value) >= cityScaleRank(scale)

  return {
    catalog: researchCatalog,
    visibleCatalog,

    firstUnlockTransportId,
    needsFirstUnlockSelection,
    firstUnlockCandidates,
    setFirstUnlockTransport,

    completedIds,
    activeResearch,

    queuedResearchIds,
    queueReserveLevel,
    queueLimit,
    queueCount,
    isQueueFull,

    unlockedTransportTiers,
    incomeMultiplier,

    researchSpeedLevel,
    researchDurationMultiplier,

    cityScale,
    unlockedFeatures,
    hasFeature,
    cityScaleAtLeast,

    getStatus,
    startResearch,

    cancelQueuedResearch,
    cancelAllQueuedResearch,

    getResearchProgress,
    getResearchRemainingTime,

    isKstTimeReady,

    // 구독 기반
    subscribeForUser,
    unsubscribe,

    // 레거시 호환
    loadForUser,
    clearUserState,

    // 저장 API
    saveNow,
    scheduleSave,

    // 설정(자동/배경 저장)
    saveEnabled,
    setSaveEnabled,

    autoSaveEnabled,
    autoSaveBase,
    autoSaveIntervalMin,
    setAutoSaveEnabled,
    setAutoSaveBase,
    setAutoSaveIntervalMin,

    autoSaveRunning,
    lastAutoSaveAtMs,

    isLoadingFirebaseData,
    isSavingFirebaseData,
    isStateLoaded,
    isHydrated,

    // 디버그
    currentWorld,
    REMOTE_OK,
    FORCE_ALL_5MIN,
  }
}
