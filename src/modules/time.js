/*
  파일명: src/modules/time.js

  역할:
  - 테라리아 표준시간 모듈입니다.
  - 현재는 브라우저 현재 시간을 표준시간으로 사용합니다.
  - 1초마다 현재 시간을 갱신하지만 화면 표시는 날짜/요일/시/분 중심입니다.
*/

import { computed, ref } from 'vue'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const currentStandardTime = ref(new Date())
let clockTimer = null

const pad2 = (value) => String(value).padStart(2, '0')

export const getWeekdayLabel = (date) => {
  return WEEKDAY_LABELS[date.getDay()] ?? '-'
}

export const formatDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} (${getWeekdayLabel(date)}) ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export const formatTimeOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export const standardNow = computed(() => currentStandardTime.value)

export const standardTimeText = computed(() => {
  return formatDateTime(currentStandardTime.value)
})

export const startStandardTimeClock = () => {
  if (clockTimer) {
    return
  }

  currentStandardTime.value = new Date()

  clockTimer = window.setInterval(() => {
    currentStandardTime.value = new Date()
  }, 1000)
}

export const stopStandardTimeClock = () => {
  if (!clockTimer) {
    return
  }

  window.clearInterval(clockTimer)
  clockTimer = null
}

export const getStandardTimeSnapshot = () => {
  return {
    iso: currentStandardTime.value.toISOString(),
    year: currentStandardTime.value.getFullYear(),
    month: currentStandardTime.value.getMonth() + 1,
    day: currentStandardTime.value.getDate(),
    weekday: getWeekdayLabel(currentStandardTime.value),
    hour: currentStandardTime.value.getHours(),
    minute: currentStandardTime.value.getMinutes(),
  }
}

export const getKoreanAgeFromBirthYear = (birthYear, baseDate = currentStandardTime.value) => {
  const parsedBirthYear = Number(birthYear)

  if (!Number.isFinite(parsedBirthYear)) {
    return 0
  }

  return Math.max(0, baseDate.getFullYear() - parsedBirthYear + 1)
}

export const getBirthDateText = (person) => {
  if (!person?.birthYear || !person?.birthMonth || !person?.birthDay) {
    return '-'
  }

  return `${person.birthYear}-${pad2(person.birthMonth)}-${pad2(person.birthDay)}`
}

export const getAnniversaryText = (person) => {
  if (!person?.birthMonth || !person?.birthDay) {
    return '-'
  }

  return `${pad2(person.birthMonth)}월 ${pad2(person.birthDay)}일`
}

export const getNextScheduledDate = ({ weekday, startTime }) => {
  const now = new Date(currentStandardTime.value)
  const targetWeekday = Number(weekday)
  const [hourText, minuteText] = String(startTime || '09:00').split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  const date = new Date(now)
  date.setSeconds(0, 0)
  date.setHours(Number.isFinite(hour) ? hour : 9, Number.isFinite(minute) ? minute : 0, 0, 0)

  const dayDiff = ((targetWeekday - now.getDay()) + 7) % 7
  date.setDate(now.getDate() + dayDiff)

  if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 7)
  }

  return date
}

export const addMinutes = (value, minutes) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setMinutes(date.getMinutes() + Number(minutes || 0))
  return date
}

export const getProgressPercentByTime = ({ startAt, endAt }) => {
  const now = currentStandardTime.value.getTime()
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }

  if (now <= start) {
    return 0
  }

  if (now >= end) {
    return 100
  }

  return Math.floor(((now - start) / (end - start)) * 100)
}

export const getTaskStatusByTime = (task) => {
  const now = currentStandardTime.value.getTime()
  const start = new Date(task.startAt).getTime()
  const end = new Date(task.endAt).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'invalid'
  }

  if (now < start) {
    return 'reserved'
  }

  if (now >= start && now < end) {
    return 'running'
  }

  return 'completed'
}

export const getRemainingText = (targetValue) => {
  const target = new Date(targetValue).getTime()
  const now = currentStandardTime.value.getTime()
  const diffMs = target - now

  if (!Number.isFinite(target)) {
    return '-'
  }

  if (diffMs <= 0) {
    return '도달'
  }

  const totalMinutes = Math.ceil(diffMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `${days}일 ${hours}시간`
  }

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }

  return `${minutes}분`
}
