/*
  파일명: src/modules/save.js

  역할:
  - 테라리아 로컬 저장 모듈입니다.
  - localStorage 기반으로 간결하게 저장합니다.
  - 저장 실패 시 앱이 멈추지 않도록 방어 처리합니다.
*/

const SAVE_KEY = 'terraria-standard-time-secretary-save-v1'
let autoSaveTimer = null

export const loadSaveData = () => {
  try {
    const rawData = window.localStorage.getItem(SAVE_KEY)

    if (!rawData) {
      return null
    }

    return JSON.parse(rawData)
  } catch (error) {
    console.warn('저장 데이터 불러오기 실패:', error)
    return null
  }
}

export const saveDataNow = (snapshot) => {
  try {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      data: snapshot,
    }

    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    return true
  } catch (error) {
    console.warn('저장 실패:', error)
    return false
  }
}

export const startAutoSave = (createSnapshot, intervalMs = 10000) => {
  if (autoSaveTimer) {
    return
  }

  autoSaveTimer = window.setInterval(() => {
    saveDataNow(createSnapshot())
  }, intervalMs)
}

export const stopAutoSave = () => {
  if (!autoSaveTimer) {
    return
  }

  window.clearInterval(autoSaveTimer)
  autoSaveTimer = null
}

export const clearSaveData = () => {
  try {
    window.localStorage.removeItem(SAVE_KEY)
    return true
  } catch (error) {
    console.warn('저장 데이터 삭제 실패:', error)
    return false
  }
}
