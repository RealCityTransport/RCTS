const SAVE_KEY = 'rcts-lite-bus-ship-save-v1'

export const loadSave = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.warn('RCTS Lite save load failed:', error)
    return null
  }
}

export const saveGame = (state) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
    return true
  } catch (error) {
    console.warn('RCTS Lite save failed:', error)
    return false
  }
}

export const clearSave = () => {
  localStorage.removeItem(SAVE_KEY)
}
