const DB_NAME = 'rcts_transport_operation_db'
const DB_VERSION = 1
const STORE_NAME = 'saves'
const SAVE_KEY = 'main-autosave'
const LOCAL_STORAGE_KEY = `${DB_NAME}:${SAVE_KEY}`

function hasIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function hasLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const testKey = `${LOCAL_STORAGE_KEY}:test`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function toPlainData(value) {
  return JSON.parse(JSON.stringify(value))
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB를 사용할 수 없습니다.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 열기에 실패했습니다.'))
    request.onblocked = () => reject(new Error('IndexedDB가 다른 탭에서 사용 중입니다.'))
  })
}

function withStore(mode, callback) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    let settled = false

    function done(value) {
      if (settled) return
      settled = true
      db.close()
      resolve(value)
    }

    function fail(error) {
      if (settled) return
      settled = true
      db.close()
      reject(error)
    }

    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = callback(store)
    let requestResult

    request.onsuccess = () => {
      requestResult = request.result
    }
    request.onerror = () => fail(request.error ?? new Error('IndexedDB 작업에 실패했습니다.'))
    transaction.oncomplete = () => done(requestResult)
    transaction.onerror = () => fail(transaction.error ?? new Error('IndexedDB 트랜잭션에 실패했습니다.'))
    transaction.onabort = () => fail(transaction.error ?? new Error('IndexedDB 트랜잭션이 중단되었습니다.'))
  }))
}

function loadFromLocalStorage() {
  if (!hasLocalStorage()) return null

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) return null

  return JSON.parse(raw)
}

function saveToLocalStorage(payload) {
  if (!hasLocalStorage()) {
    throw new Error('브라우저 저장소를 사용할 수 없습니다.')
  }

  const savedAt = new Date().toISOString()
  const record = {
    id: SAVE_KEY,
    version: 1,
    savedAt,
    storage: 'localStorage',
    payload: toPlainData(payload),
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(record))
  return savedAt
}

export async function loadRctsAutoSave() {
  try {
    return await withStore('readonly', (store) => store.get(SAVE_KEY))
  } catch {
    return loadFromLocalStorage()
  }
}

export async function saveRctsAutoSave(payload) {
  const plainPayload = toPlainData(payload)
  const savedAt = new Date().toISOString()

  try {
    await withStore('readwrite', (store) => store.put({
      id: SAVE_KEY,
      version: 1,
      savedAt,
      storage: 'indexedDB',
      payload: plainPayload,
    }))
    return savedAt
  } catch (error) {
    try {
      return saveToLocalStorage(plainPayload)
    } catch {
      throw error instanceof Error ? error : new Error('자동저장에 실패했습니다.')
    }
  }
}
