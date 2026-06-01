// RCTS FILE CONTEXT
// 파일 역할:
// - RCTS 월드 데이터를 브라우저 IndexedDB에 저장/불러오기/삭제하는 모듈.
// - 현재는 단일 월드 슬롯 하나만 사용한다.
// - 저장은 자동저장이 아니라 사용자가 버튼을 눌렀을 때만 실행된다.
//
// 현재 연결:
// - Home.vue에서 saveWorldState(), loadWorldState(), deleteWorldState()를 호출한다.
// - CompanySettingsPanel.vue의 데이터 영역 버튼에서 Home.vue 이벤트를 통해 사용된다.
//
// 현재 규칙:
// - IndexedDB 저장소 이름: rcts-local-world-db
// - objectStore 이름: worlds
// - 단일 저장 키: primary-world
// - 저장 대상: company, activeMenu, completedResearch, activeResearch 등 현재 월드 상태.
//
// 주의:
// - 외부 파일 저장, 서버 저장, 자동저장은 아직 제공하지 않는다.
// - 이 모듈은 브라우저 로컬 IndexedDB만 담당한다.
//
// 다음 작업 방향:
// - 다중 저장 슬롯.
// - 백업/내보내기 JSON.
// - 서버/Firebase 백업.
// - 저장 데이터 버전 마이그레이션.

const DB_NAME = 'rcts-local-world-db'
const DB_VERSION = 1
const STORE_NAME = 'worlds'
const WORLD_KEY = 'primary-world'

function openWorldDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

function runTransaction(mode, callback) {
  return new Promise(async (resolve, reject) => {
    let db = null

    try {
      db = await openWorldDb()

      const transaction = db.transaction(STORE_NAME, mode)
      const store = transaction.objectStore(STORE_NAME)
      const request = callback(store)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      transaction.oncomplete = () => {
        db.close()
      }

      transaction.onerror = () => {
        reject(transaction.error)
        db.close()
      }
    } catch (error) {
      if (db) {
        db.close()
      }

      reject(error)
    }
  })
}

export async function saveWorldState(worldState) {
  const savedAt = new Date().toISOString()

  const record = {
    id: WORLD_KEY,
    savedAt,
    version: 1,
    data: JSON.parse(JSON.stringify(worldState)),
  }

  await runTransaction('readwrite', (store) => {
    return store.put(record)
  })

  return record
}

export async function loadWorldState() {
  const record = await runTransaction('readonly', (store) => {
    return store.get(WORLD_KEY)
  })

  return record || null
}

export async function deleteWorldState() {
  await runTransaction('readwrite', (store) => {
    return store.delete(WORLD_KEY)
  })

  return true
}

export async function getWorldStorageInfo() {
  const record = await loadWorldState()

  if (!record) {
    return {
      hasSavedData: false,
      savedAt: null,
      version: null,
    }
  }

  return {
    hasSavedData: true,
    savedAt: record.savedAt,
    version: record.version,
  }
}