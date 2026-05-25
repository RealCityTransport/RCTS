// src/composables/useKstTime.js
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * ✅ KST 표준시간 모듈
 * - 1초 tick로 갱신 (표시는 분 단위)
 * - 표시 형식: YYYY. MM. DD. HH:MM
 * - 요일: 월/화/수/목/금/토/일
 */

const _now = ref(Date.now())
let _timer = null
let _inited = false

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toKstParts(ms) {
  const kstMs = ms + 9 * 60 * 60 * 1000
  const d = new Date(kstMs)

  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const hh = d.getUTCHours()
  const mm = d.getUTCMinutes()
  const ss = d.getUTCSeconds()

  const week = d.getUTCDay()
  const weekKor = ['일', '월', '화', '수', '목', '금', '토'][week]

  return { y, m, day, hh, mm, ss, weekKor }
}

function initTickerOnce() {
  if (_inited) return
  _inited = true

  if (_timer) clearInterval(_timer)
  _timer = setInterval(() => {
    _now.value = Date.now()
  }, 1000)
}

function stopTicker() {
  if (_timer) clearInterval(_timer)
  _timer = null
  _inited = false
}

export function useKstTime() {
  onMounted(() => initTickerOnce())
  onBeforeUnmount(() => {
    // 다중 사용을 고려하여 stopTicker는 수동 호출로 둡니다.
  })

  const parts = computed(() => toKstParts(_now.value))

  const kstDate = computed(() => {
    const p = parts.value
    return `${p.y}. ${pad2(p.m)}. ${pad2(p.day)}`
  })

  const kstTime = computed(() => {
    const p = parts.value
    return `${pad2(p.hh)}:${pad2(p.mm)}`
  })

  const kstWeekday = computed(() => parts.value.weekKor)
  const kstFull = computed(() => `${kstDate.value}. ${kstTime.value}`)

  return {
    nowMs: _now,
    kstDate,
    kstTime,
    kstWeekday,
    kstFull,
    initTickerOnce,
    stopTicker,
  }
}
