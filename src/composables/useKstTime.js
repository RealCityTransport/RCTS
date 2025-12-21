// useKstTime.js
import { ref } from 'vue'

const kstDate = ref(null)
const kstString = ref('')
const isKstTimeReady = ref(false)
let timer = null

const pad2 = (n) => String(n).padStart(2, '0')

const getKSTDate = () => {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 9 * 60 * 60 * 1000)
}

const formatKST = (date) => {
  if (!(date instanceof Date)) return '로딩중...'
  const Y = date.getFullYear()
  const M = pad2(date.getMonth() + 1)
  const D = pad2(date.getDate())
  const h = pad2(date.getHours())
  const m = pad2(date.getMinutes())
  return `${Y}. ${M}. ${D}. ${h}:${m}`
}

export function initializeKstTimeTracker() {
  if (timer) return

  const update = () => {
    kstDate.value = getKSTDate()
    kstString.value = formatKST(kstDate.value)
    if (!isKstTimeReady.value) isKstTimeReady.value = true
  }

  update()
  timer = setInterval(update, 1000)
}

export function useKstTime() {
  return {
    kstDate,
    kstString,
    isKstTimeReady
  }
}
