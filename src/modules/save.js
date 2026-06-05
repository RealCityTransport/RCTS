/*
  파일명: src/modules/save.js

  역할:
  - RCTS v2 저장 모듈입니다.
  - IndexedDB 기반으로 게임 데이터를 저장합니다.
  - 저장 / 불러오기 / 내보내기 / 가져오기 / 삭제 기능을 담당합니다.

  지원 기능:
  1. saveGame(gameState)
  2. loadGame()
  3. hasSave()
  4. deleteSave()
  5. exportSave()
  6. importSave(file)
  7. downloadSaveFile(gameState)

  저장 방식:
  - IndexedDB
  - DB 이름: RCTS_V2_DB
  - Store 이름: saves
  - 기본 저장 키: main
*/

const DB_NAME = 'RCTS_V2_DB'
const DB_VERSION = 1
const STORE_NAME = 'saves'
const SAVE_KEY = 'main'

/*
  IndexedDB 열기
*/
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('IndexedDB를 열 수 없습니다.'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        })
      }
    }
  })
}

/*
  저장 데이터 정리

  - 저장 시점 갱신
  - JSON 변환 가능한 순수 객체로 복사
*/
const normalizeSaveData = (gameState) => {
  return {
    id: SAVE_KEY,
    savedAt: Date.now(),
    data: JSON.parse(JSON.stringify(gameState)),
  }
}

/*
  게임 저장
*/
export const saveGame = async (gameState) => {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const saveData = normalizeSaveData(gameState)

    const request = store.put(saveData)

    request.onerror = () => {
      reject(new Error('게임 저장에 실패했습니다.'))
    }

    request.onsuccess = () => {
      resolve(saveData)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/*
  게임 불러오기

  반환:
  - 저장 데이터가 있으면 gameState 객체
  - 없으면 null
*/
export const loadGame = async () => {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.get(SAVE_KEY)

    request.onerror = () => {
      reject(new Error('게임 불러오기에 실패했습니다.'))
    }

    request.onsuccess = () => {
      const result = request.result

      if (!result) {
        resolve(null)
        return
      }

      resolve(result.data)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/*
  저장 데이터 존재 여부 확인
*/
export const hasSave = async () => {
  const saved = await loadGame()
  return saved !== null
}

/*
  저장 삭제
*/
export const deleteSave = async () => {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.delete(SAVE_KEY)

    request.onerror = () => {
      reject(new Error('저장 데이터 삭제에 실패했습니다.'))
    }

    request.onsuccess = () => {
      resolve(true)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/*
  저장 데이터 내보내기용 객체 생성
*/
export const exportSave = async () => {
  const gameState = await loadGame()

  if (!gameState) {
    throw new Error('내보낼 저장 데이터가 없습니다.')
  }

  return {
    exportedAt: Date.now(),
    app: 'RCTS v2',
    type: 'rcts-save',
    data: gameState,
  }
}

/*
  저장 파일 다운로드

  사용 예:
  await downloadSaveFile(gameState)
*/
export const downloadSaveFile = async (gameState) => {
  const exportData = {
    exportedAt: Date.now(),
    app: 'RCTS v2',
    type: 'rcts-save',
    data: gameState,
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], {
    type: 'application/json',
  })

  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  const fileName = `rcts-v2-save-${yyyy}${mm}${dd}-${hh}${mi}.json`

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()

  URL.revokeObjectURL(url)

  return fileName
}

/*
  저장 파일 불러오기

  file:
  - input type="file"에서 받은 File 객체

  반환:
  - 검증된 gameState 객체
*/
export const importSave = async (file) => {
  if (!file) {
    throw new Error('불러올 파일이 없습니다.')
  }

  const text = await file.text()
  const parsed = JSON.parse(text)

  if (parsed.type !== 'rcts-save') {
    throw new Error('RCTS 저장 파일이 아닙니다.')
  }

  if (!parsed.data) {
    throw new Error('저장 데이터가 비어 있습니다.')
  }

  await saveGame(parsed.data)

  return parsed.data
}