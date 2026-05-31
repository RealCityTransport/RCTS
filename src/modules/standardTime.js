// src/modules/standardTime.js
import { reactive, readonly } from 'vue'

const SEOUL_TIME_ZONE = 'Asia/Seoul'
const ONE_SECOND = 1000
const HOURLY_RESYNC_TICK = 60 * 60

const state = reactive({
  initialized: false,
  running: false,

  /**
   * 표준시간 모듈 기준 틱
   * 1 tick = 1 second
   */
  tick: 0,

  /**
   * 현재 세션이 시작된 실제 시간
   */
  startedAtMs: 0,

  /**
   * 마지막 실제 시간 동기화 시점
   */
  lastSyncAtMs: 0,

  /**
   * 현재 표준시간 ms
   */
  currentMs: 0,

  /**
   * 마지막 동기화 때 감지된 오차
   */
  driftMs: 0,

  /**
   * 화면 표시용 서울 시간
   */
  kstDate: '',
  kstTime: '',
  kstDateTime: '',
  kstFullDateTime: '',

  /**
   * 내부 확인용 ISO
   */
  iso: '',
})

let tickTimer = null
let lastResyncTick = 0

function pad(value) {
  return String(value).padStart(2, '0')
}

function getSeoulDateParts(ms) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(new Date(ms))

  const result = {
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    second: '',
  }

  for (const part of parts) {
    if (part.type in result) {
      result[part.type] = part.value
    }
  }

  return result
}

function updateDisplayTime(ms) {
  const parts = getSeoulDateParts(ms)

  const year = parts.year
  const month = pad(parts.month)
  const day = pad(parts.day)
  const hour = pad(parts.hour)
  const minute = pad(parts.minute)
  const second = pad(parts.second)

  state.kstDate = `${year}.${month}.${day}`
  state.kstTime = `${hour}:${minute}`
  state.kstDateTime = `${year}.${month}.${day} ${hour}:${minute}`
  state.kstFullDateTime = `${year}.${month}.${day} ${hour}:${minute}:${second}`
  state.iso = new Date(ms).toISOString()
}

function syncWithRealTime() {
  const realNow = Date.now()
  const previousStandardTime = state.currentMs || realNow

  state.driftMs = realNow - previousStandardTime
  state.currentMs = realNow
  state.startedAtMs = realNow - state.tick * ONE_SECOND
  state.lastSyncAtMs = realNow

  lastResyncTick = state.tick

  updateDisplayTime(state.currentMs)
}

function stepTick() {
  state.tick += 1
  state.currentMs += ONE_SECOND

  updateDisplayTime(state.currentMs)

  /**
   * 1시간마다 실제 시간과 재동기화
   * 평소에는 1초 = 1틱으로 흐르고,
   * 장시간 켜져 있을 때 생길 수 있는 오차만 보정한다.
   */
  if (state.tick - lastResyncTick >= HOURLY_RESYNC_TICK) {
    syncWithRealTime()
  }
}

function start() {
  if (state.running) return

  const now = Date.now()

  state.initialized = true
  state.running = true
  state.tick = 0
  state.startedAtMs = now
  state.lastSyncAtMs = now
  state.currentMs = now
  state.driftMs = 0

  lastResyncTick = 0

  updateDisplayTime(now)

  tickTimer = window.setInterval(() => {
    stepTick()
  }, ONE_SECOND)

  console.info('[StandardTime] started', {
    timeZone: SEOUL_TIME_ZONE,
    tickRule: '1 tick = 1 second',
    kstDateTime: state.kstFullDateTime,
  })
}

function stop() {
  if (tickTimer) {
    window.clearInterval(tickTimer)
    tickTimer = null
  }

  state.running = false

  console.info('[StandardTime] stopped')
}

function reset() {
  stop()

  state.initialized = false
  state.running = false
  state.tick = 0
  state.startedAtMs = 0
  state.lastSyncAtMs = 0
  state.currentMs = 0
  state.driftMs = 0
  state.kstDate = ''
  state.kstTime = ''
  state.kstDateTime = ''
  state.kstFullDateTime = ''
  state.iso = ''

  lastResyncTick = 0
}

function getSnapshot() {
  return {
    initialized: state.initialized,
    running: state.running,
    tick: state.tick,
    startedAtMs: state.startedAtMs,
    lastSyncAtMs: state.lastSyncAtMs,
    currentMs: state.currentMs,
    driftMs: state.driftMs,
    kstDate: state.kstDate,
    kstTime: state.kstTime,
    kstDateTime: state.kstDateTime,
    kstFullDateTime: state.kstFullDateTime,
    iso: state.iso,
    timeZone: SEOUL_TIME_ZONE,
  }
}

export const standardTime = {
  state: readonly(state),
  start,
  stop,
  reset,
  syncWithRealTime,
  getSnapshot,
}