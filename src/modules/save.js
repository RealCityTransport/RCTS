/*
  파일 주소:
  src/modules/save.js

  적용 내용:
  - RCTS 로컬 저장 모듈
  - IndexedDB 기반 저장/불러오기/삭제/내보내기/가져오기 기능 제공
  - 실제 저장 대상은 gameState.js의 createGameSnapshot()
  - 불러오기 시 applyGameSnapshot()으로 실제 게임 상태를 복원
  - 자동저장 기능 제공
  - gameState 변경 시 debounce 후 자동저장
  - 기존 DB에 saves object store가 없는 경우 자동 복구

  연결된 파일:
  - src/App.vue
  - src/modules/gameState.js
  - src/views/SettingsView.vue

  향후 연결 예정:
  - src/modules/finance.js
  - src/modules/operations.js
  - src/modules/settlement.js

  수정 시 주의:
  - 저장 대상은 gameState.js의 실제 상태
  - 자동저장은 항상 켜지는 기본 정책
  - 세이브 구조 변경 시 SAVE_SCHEMA_VERSION과 validateSaveRecord()를 같이 수정
*/

import { reactive, watch } from 'vue'
import {
  GAME_VERSION,
  SAVE_SCHEMA_VERSION,
  applyGameSnapshot,
  createGameSnapshot,
  gameState
} from './gameState'

const DB_NAME = 'rcts-local-save-db'
const DB_VERSION = 2
const STORE_NAME = 'saves'
const PRIMARY_SAVE_ID = 'primary-save'

let dbPromise = null
let initPromise = null
let autoSaveStopHandle = null
let autoSaveTimer = null
let isWriting = false
let pendingSaveAfterWrite = false

export const saveState = reactive({
  isReady: false,
  isLoading: false,
  hasSave: false,

  autoSaveEnabled: false,
  lastAutoSavedAt: null,

  storageName: 'Local Save',
  schemaVersion: SAVE_SCHEMA_VERSION,
  gameVersion: GAME_VERSION,

  lastSavedAt: null,
  lastLoadedAt: null,
  lastCheckedAt: null,

  message: '저장 준비 중',
  error: ''
})

export function initSaveModule() {
  if (initPromise) {
    return initPromise
  }

  initPromise = initializeSaveModuleInternal()
  return initPromise
}

export function startAutoSave() {
  if (autoSaveStopHandle) {
    saveState.autoSaveEnabled = true
    return
  }

  saveState.autoSaveEnabled = true

  autoSaveStopHandle = watch(
    gameState,
    () => {
      queueAutoSave()
    },
    {
      deep: true,
      flush: 'post'
    }
  )

  window.addEventListener('beforeunload', handleBeforeUnload)
}

export function stopAutoSave() {
  if (autoSaveStopHandle) {
    autoSaveStopHandle()
    autoSaveStopHandle = null
  }

  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }

  window.removeEventListener('beforeunload', handleBeforeUnload)
  saveState.autoSaveEnabled = false
}

export async function saveGame() {
  return performSave({
    silent: false,
    reason: 'manual'
  })
}

export async function loadGame() {
  await ensureReady()

  saveState.isLoading = true
  saveState.error = ''
  saveState.message = '불러오는 중'

  try {
    const saveRecord = await readRawSave()

    if (!saveRecord) {
      saveState.hasSave = false
      saveState.message = '불러올 저장 데이터가 없습니다.'
      return null
    }

    validateSaveRecord(saveRecord)

    applyGameSnapshot(saveRecord.payload)

    const now = Date.now()

    saveState.hasSave = true
    saveState.lastLoadedAt = now
    saveState.lastCheckedAt = now
    saveState.message = '불러오기 완료'
    saveState.error = ''

    return saveRecord.payload
  } catch (error) {
    saveState.error = getErrorMessage(error)
    saveState.message = '불러오기 실패'
    throw error
  } finally {
    saveState.isLoading = false
  }
}

export async function clearSave() {
  await ensureReady()

  saveState.isLoading = true
  saveState.error = ''
  saveState.message = '삭제 중'

  try {
    const db = await getDatabase()

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(PRIMARY_SAVE_ID)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    saveState.hasSave = false
    saveState.lastSavedAt = null
    saveState.lastLoadedAt = null
    saveState.lastAutoSavedAt = null
    saveState.lastCheckedAt = Date.now()
    saveState.message = '저장 데이터 삭제 완료'
    saveState.error = ''
  } catch (error) {
    saveState.error = getErrorMessage(error)
    saveState.message = '삭제 실패'
    throw error
  } finally {
    saveState.isLoading = false
  }
}

export async function exportSaveFile() {
  await ensureReady()

  saveState.isLoading = true
  saveState.error = ''
  saveState.message = '백업 파일 생성 중'

  try {
    let saveRecord = await readRawSave()

    if (!saveRecord) {
      saveRecord = await performSave({
        silent: true,
        reason: 'export'
      })
    }

    validateSaveRecord(saveRecord)

    const jsonText = JSON.stringify(saveRecord, null, 2)
    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const dateText = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')

    link.href = url
    link.download = `rcts-save-${dateText}.json`
    link.click()

    URL.revokeObjectURL(url)

    saveState.message = '백업 파일 생성 완료'
    saveState.error = ''
  } catch (error) {
    saveState.error = getErrorMessage(error)
    saveState.message = '백업 파일 생성 실패'
    throw error
  } finally {
    saveState.isLoading = false
  }
}

export async function importSaveFile(file) {
  await ensureReady()

  if (!file) {
    return null
  }

  saveState.isLoading = true
  saveState.error = ''
  saveState.message = '백업 파일 가져오는 중'

  try {
    const text = await file.text()
    const importedData = JSON.parse(text)
    const normalizedSave = normalizeImportedSave(importedData)
    const safeSaveRecord = toIndexedDbSafeObject(normalizedSave)

    validateSaveRecord(safeSaveRecord)

    await writeRawSave(safeSaveRecord)
    applyGameSnapshot(safeSaveRecord.payload)

    const now = Date.now()

    saveState.hasSave = true
    saveState.lastSavedAt = safeSaveRecord.updatedAt ?? safeSaveRecord.savedAt ?? now
    saveState.lastLoadedAt = now
    saveState.lastCheckedAt = now
    saveState.message = '백업 파일 적용 완료'
    saveState.error = ''

    return safeSaveRecord.payload
  } catch (error) {
    saveState.error = getErrorMessage(error)
    saveState.message = '백업 파일 가져오기 실패'
    throw error
  } finally {
    saveState.isLoading = false
  }
}

export async function getSaveSummary() {
  await ensureReady()

  const saveRecord = await readRawSave()

  if (!saveRecord) {
    return null
  }

  validateSaveRecord(saveRecord)

  return {
    schemaVersion: saveRecord.schemaVersion,
    gameVersion: saveRecord.gameVersion,
    createdAt: saveRecord.createdAt,
    savedAt: saveRecord.savedAt,
    updatedAt: saveRecord.updatedAt,
    companyName: saveRecord.payload?.world?.companyName ?? 'Unknown',
    funds: saveRecord.payload?.finance?.funds ?? 0,
    vehicleCount: saveRecord.payload?.vehicles?.length ?? 0,
    operationCount: saveRecord.payload?.operationSlots?.length ?? 0
  }
}

function queueAutoSave() {
  if (!saveState.autoSaveEnabled) {
    return
  }

  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }

  const delay = Number(gameState.settings?.autosaveDelayMs ?? 1500)

  autoSaveTimer = window.setTimeout(() => {
    autoSaveTimer = null

    void performSave({
      silent: true,
      reason: 'auto'
    })
  }, delay)
}

async function performSave({ silent, reason }) {
  await ensureReady()

  if (isWriting) {
    pendingSaveAfterWrite = true
    return null
  }

  isWriting = true

  if (!silent) {
    saveState.isLoading = true
    saveState.error = ''
    saveState.message = '저장 중'
  }

  try {
    const now = Date.now()
    const previousSave = await readRawSave()
    const snapshot = createGameSnapshot()

    const saveRecord = {
      id: PRIMARY_SAVE_ID,
      schemaVersion: SAVE_SCHEMA_VERSION,
      gameVersion: GAME_VERSION,
      createdAt: previousSave?.createdAt ?? now,
      savedAt: now,
      updatedAt: now,
      payload: snapshot
    }

    const safeSaveRecord = toIndexedDbSafeObject(saveRecord)

    validateSaveRecord(safeSaveRecord)

    await writeRawSave(safeSaveRecord)

    saveState.hasSave = true
    saveState.lastSavedAt = now
    saveState.lastCheckedAt = now
    saveState.error = ''

    if (reason === 'auto') {
      saveState.lastAutoSavedAt = now
      saveState.message = '자동 저장 완료'
    } else if (!silent) {
      saveState.message = '저장 완료'
    }

    return safeSaveRecord
  } catch (error) {
    saveState.error = getErrorMessage(error)
    saveState.message = silent ? '자동 저장 실패' : '저장 실패'
    throw error
  } finally {
    isWriting = false

    if (!silent) {
      saveState.isLoading = false
    }

    if (pendingSaveAfterWrite) {
      pendingSaveAfterWrite = false
      queueAutoSave()
    }
  }
}

async function initializeSaveModuleInternal() {
  saveState.isLoading = true
  saveState.error = ''
  saveState.message = '저장 준비 중'

  try {
    await getDatabase()

    const existingSave = await readRawSave()

    saveState.hasSave = Boolean(existingSave)
    saveState.lastSavedAt = existingSave?.updatedAt ?? existingSave?.savedAt ?? null
    saveState.lastCheckedAt = Date.now()
    saveState.isReady = true
    saveState.message = existingSave ? '저장 데이터 있음' : '저장 가능'
  } catch (error) {
    saveState.isReady = false
    saveState.error = getErrorMessage(error)
    saveState.message = '저장 준비 실패'

    initPromise = null
    throw error
  } finally {
    saveState.isLoading = false
  }
}

async function ensureReady() {
  await initSaveModule()

  if (!saveState.isReady) {
    throw new Error('저장 기능이 준비되지 않았습니다.')
  }
}

function handleBeforeUnload() {
  if (!saveState.autoSaveEnabled) {
    return
  }

  void performSave({
    silent: true,
    reason: 'auto'
  })
}

function getDatabase() {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = openDatabaseWithStore(DB_VERSION)

  return dbPromise
}

function openDatabaseWithStore(version) {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('이 브라우저는 저장 기능을 지원하지 않습니다.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, version)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const db = request.result

      if (db.objectStoreNames.contains(STORE_NAME)) {
        resolve(db)
        return
      }

      const nextVersion = db.version + 1

      db.close()
      dbPromise = null

      openDatabaseWithStore(nextVersion)
        .then(resolve)
        .catch(reject)
    }

    request.onerror = () => {
      reject(request.error)
    }

    request.onblocked = () => {
      reject(new Error('다른 RCTS 탭을 닫고 다시 시도하세요.'))
    }
  })
}

async function readRawSave() {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      reject(new Error('저장 공간을 찾을 수 없습니다.'))
      return
    }

    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(PRIMARY_SAVE_ID)

    request.onsuccess = () => {
      resolve(request.result ?? null)
    }

    request.onerror = () => {
      reject(request.error)
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

async function writeRawSave(saveRecord) {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      reject(new Error('저장 공간을 찾을 수 없습니다.'))
      return
    }

    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(saveRecord)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

function normalizeImportedSave(importedData) {
  if (importedData?.id === PRIMARY_SAVE_ID && importedData?.payload) {
    return importedData
  }

  const now = Date.now()

  return {
    id: PRIMARY_SAVE_ID,
    schemaVersion: importedData?.schemaVersion ?? SAVE_SCHEMA_VERSION,
    gameVersion: importedData?.gameVersion ?? GAME_VERSION,
    createdAt: importedData?.createdAt ?? now,
    savedAt: importedData?.savedAt ?? now,
    updatedAt: now,
    payload: importedData?.payload ?? importedData
  }
}

function validateSaveRecord(saveRecord) {
  if (!saveRecord || typeof saveRecord !== 'object') {
    throw new Error('세이브 데이터 형식이 올바르지 않습니다.')
  }

  if (saveRecord.id !== PRIMARY_SAVE_ID) {
    throw new Error('RCTS 저장 데이터가 아닙니다.')
  }

  if (typeof saveRecord.schemaVersion !== 'number') {
    throw new Error('저장 데이터 버전이 없습니다.')
  }

  if (!saveRecord.payload || typeof saveRecord.payload !== 'object') {
    throw new Error('저장 데이터 본문이 없습니다.')
  }

  if (!saveRecord.payload.world) {
    throw new Error('월드 데이터가 없습니다.')
  }

  if (!saveRecord.payload.finance) {
    throw new Error('재정 데이터가 없습니다.')
  }

  if (!Array.isArray(saveRecord.payload.vehicles)) {
    throw new Error('차량 데이터가 올바르지 않습니다.')
  }

  if (!Array.isArray(saveRecord.payload.operationSlots)) {
    throw new Error('운행 슬롯 데이터가 올바르지 않습니다.')
  }

  const funds = saveRecord.payload.finance.funds

  if (typeof funds !== 'number' || Number.isNaN(funds) || funds < 0) {
    throw new Error('자금 데이터가 올바르지 않습니다.')
  }
}

function toIndexedDbSafeObject(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    throw new Error('저장할 수 없는 데이터가 포함되어 있습니다.')
  }
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}