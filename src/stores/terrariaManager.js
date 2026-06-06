/*
  파일명: src/stores/terrariaManager.js

  역할:
  - 테라리아 표준시간 비서 스케줄러의 공용 상태 관리자입니다.
  - 프로젝트/보상/차량/노선 중심 구조를 제거하고,
    비서 보고 → 카운터 진행 / 비서 표준시간 진행 → 완료 보고 구조로 구성합니다.

  핵심 규칙:
  - 유저는 회사 사장입니다.
  - NPC는 각 부서의 비서/담당자입니다.
  - 비서는 부서에 맞는 임무를 보고합니다.
  - 사장은 카운터 임무를 직접 진행하고, 표준시간 임무는 비서가 자동으로 진행합니다.
  - 예약된 업무는 표준시간에 따라 대기/진행/완료 상태로 바뀝니다.
  - 완료 수량/보상/프로젝트 진행도는 핵심 지표로 사용하지 않습니다.
  - 가족/관계 시스템은 상태 기반의 숨김형 장기 시스템으로 확장 가능하도록 데이터만 준비합니다.
*/

import { computed, reactive } from 'vue'
import {
  addMinutes,
  formatDateTime,
  getKoreanAgeFromBirthYear,
  getNextScheduledDate,
  getProgressPercentByTime,
  getTaskStatusByTime,
  standardNow,
} from '../modules/time'

const clonePlain = (value) => JSON.parse(JSON.stringify(value ?? null))

const createId = (prefix) => {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomPart}`
}

const getRandomItem = (items) => {
  return items[Math.floor(Math.random() * items.length)]
}

const getRandomInteger = (min, max) => {
  const safeMin = Math.ceil(Math.min(min, max))
  const safeMax = Math.floor(Math.max(min, max))

  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin
}

const addDays = (value, days) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setDate(date.getDate() + Number(days || 0))
  return date
}

const pad2 = (value) => String(value).padStart(2, '0')

const getDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

const parseDateKey = (dateKey) => {
  const [yearText, monthText, dayText] = String(dateKey || '').split('-')
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText))

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const getWeightedRandomItem = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 1), 0)
  let cursor = Math.random() * totalWeight

  for (const item of items) {
    cursor -= Number(item.weight || 1)

    if (cursor <= 0) {
      return item
    }
  }

  return items[items.length - 1]
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
  { value: 0, label: '일요일' },
]

const DEPARTMENTS = [
  {
    id: 'executive',
    label: '비서실',
    role: '총괄 비서',
    accent: '#7c3aed',
    objects: ['주간 업무 흐름', '사장실 보고 체계', '부서 간 일정', '장기 대기 업무', '내부 조율 절차'],
    actions: ['정리', '점검', '재조율', '검토', '안정화'],
    endings: ['계획', '업무', '검토', '보고', '조율'],
  },
  {
    id: 'transport',
    label: '교통부',
    role: '교통 비서',
    accent: '#0ea5e9',
    objects: ['동부 연결망', '북부 이동 동선', '중앙 환승 구역', '서부 교통 흐름', '남부 접근 통로'],
    actions: ['점검', '안정화', '혼잡 확인', '연결 상태 확인', '운영 개선'],
    endings: ['계획', '업무', '현장 확인', '검토', '보고'],
  },
  {
    id: 'facility',
    label: '시설부',
    role: '시설 비서',
    accent: '#f97316',
    objects: ['중앙 시설 전력', '남부 설비 상태', '북부 거점 시설', '동부 창고 구역', '외곽 안전 설비'],
    actions: ['점검', '복구 준비', '상태 확인', '야간 확인', '안정화'],
    endings: ['업무', '계획', '점검', '현장 보고', '검토'],
  },
  {
    id: 'admin',
    label: '행정부',
    role: '행정 비서',
    accent: '#22c55e',
    objects: ['외부 협의 문서', '주간 승인 절차', '계약 조건', '부서 요청 사항', '일정 조율 문서'],
    actions: ['검토', '정리', '재확인', '조율', '승인 준비'],
    endings: ['업무', '검토', '보고', '정리', '협의'],
  },
  {
    id: 'technology',
    label: '기술부',
    role: '기술 비서',
    accent: '#06b6d4',
    objects: ['통신 시스템', '자동화 장비', '데이터 백업 체계', '관제 시스템', '내부 서버 상태'],
    actions: ['점검', '오류 분석', '안정화', '백업 확인', '재가동 준비'],
    endings: ['업무', '분석', '점검', '보고', '검토'],
  },
  {
    id: 'security',
    label: '보안부',
    role: '보안 비서',
    accent: '#ef4444',
    objects: ['야간 출입 기록', '위험 구역', '중앙 보안 체계', '외곽 감시 구역', '내부 접근 권한'],
    actions: ['확인', '순찰 계획', '점검', '안정화', '기록 검토'],
    endings: ['업무', '계획', '보고', '점검', '검토'],
  },
]

const MISSION_CONTEXTS = [
  '현장팀 사전 확인이 필요합니다.',
  '관련 부서의 일정 확보가 필요합니다.',
  '표준시간 기준으로 장시간 배정하는 편이 안정적입니다.',
  '다른 예약 업무와 겹치지 않게 배정하는 것이 좋습니다.',
  '사전 준비가 끝나면 지정된 시간에 자동 진행됩니다.',
  '업무 특성상 중간 보고 없이 종료 시점에 결과가 올라옵니다.',
  '지금 바로 처리할 필요는 없지만 예약 대기 상태로 두면 누적될 수 있습니다.',
  '부서 내부 검토는 완료되었고 사장님의 시간 배정만 남았습니다.',
]

const COUNTER_MISSION_TYPES = [
  { label: '즉시 점검형', weight: 8, minMinutes: 20, maxMinutes: 90, priority: '보통' },
  { label: '단기 처리형', weight: 7, minMinutes: 60, maxMinutes: 180, priority: '보통' },
  { label: '현장 대응형', weight: 5, minMinutes: 120, maxMinutes: 360, priority: '중요' },
  { label: '긴급 정리형', weight: 4, minMinutes: 180, maxMinutes: 480, priority: '중요' },
]

const STANDARD_MISSION_TYPES = [
  { label: '표준 점검형', weight: 5, minHours: 2, maxHours: 4, priority: '보통' },
  { label: '표준 조율형', weight: 4, minHours: 3, maxHours: 6, priority: '보통' },
  { label: '표준 현장형', weight: 3, minHours: 4, maxHours: 8, priority: '중요' },
]

const EXECUTION_MODES = [
  { value: 'counter', label: '카운터 임무', weight: 10 },
  { value: 'secretary-standard', label: '비서 자동 표준시간 임무', weight: 4 },
]

const STARTER_EXECUTION_MODES = [
  { value: 'counter', label: '카운터 임무', weight: 1 },
]


const REPORT_TEMPLATES = [
  '사장님, {projectName} 관련 업무가 접수되었습니다.',
  '{projectName} 건으로 보고드립니다.',
  '{departmentName}에서 {projectName} 업무를 올렸습니다.',
  '사장님, {projectName} 관련 요청이 들어왔습니다.',
  '{projectName}에 대한 사전 확인 업무가 필요합니다.',
  '현재 {projectName} 업무가 대기 중입니다.',
  '{departmentName} 보고입니다. {projectName} 관련 조치가 필요합니다.',
  '사장님, {projectName} 업무 확인이 필요합니다.',
  '{projectName} 관련 업무가 접수되었습니다.',
  '{departmentName}에서 {projectName}을 우선 검토 대상으로 올렸습니다.',
  '사장님, {projectName} 업무가 보류함에 등록되었습니다.',
  '{projectName} 관련 업무가 누적되기 전에 처리하는 편이 좋겠습니다.',
  '{departmentName} 쪽에서 {projectName} 진행을 요청했습니다.',
  '사장님, {projectName}에 필요한 담당 인력은 준비 가능합니다.',
  '{projectName} 업무는 표준시간 기준으로 처리됩니다.',
  '{departmentName} 확인 결과, {projectName} 진행이 가능하다고 합니다.',
  '사장님, {projectName}은 일정 충돌 확인이 필요합니다.',
  '{projectName} 관련 보고가 올라왔습니다.',
  '현재 대기 중인 업무 중 {projectName}이 있습니다.',
  '{departmentName}에서 {projectName} 업무 처리를 요청했습니다.',
]

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍', '차']
const MIDDLE_SYLLABLES = ['서', '지', '하', '유', '민', '도', '태', '시', '세', '은', '수', '현', '준', '가', '나', '예', '채', '다', '소', '하']
const LAST_SYLLABLES = ['윤', '린', '아', '우', '준', '현', '민', '서', '원', '율', '진', '빈', '희', '영', '호', '은', '연', '온', '찬', '겸']
const GENDERS = ['female', 'male']

const FAMILY_STATUS_LABELS = {
  single: '미혼',
  married: '기혼',
}

const PREGNANCY_CHANCE_PER_PRIVATE_TIME = 0.03
const PREGNANCY_RECOGNITION_DAYS = 28
const PREGNANCY_DUE_DAYS = 280
const PRIVATE_TIME_COOLDOWN_HOURS = 24
const STANDARD_REPORT_GRANT_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
const WEEKDAY_REPORT_DAYS = [1, 2, 3, 4, 5]
const DAILY_COUNTER_REPORT_LIMIT_AFTER_SECRETARY = 17

const EXECUTION_MODE_LABELS = {
  counter: '카운터 진행',
  'user-standard': '표준시간 예약',
  'secretary-standard': '비서 표준시간 자동',
}

const createDefaultState = () => ({
  initialized: false,
  player: null,
  secretaries: [],
  pendingSecretaryCandidates: [],
  missionReports: [],
  onboarding: {
    nextSecretaryDepartmentIndex: 0,
    userAcceptedBeforeSecretary: 0,
    secretaryUnlockThreshold: 100,
  },
  stats: {
    totalAcceptedMissions: 0,
    totalUserAcceptedMissions: 0,
  },
  scheduledTasks: [],
  completedReports: [],
  family: {
    status: 'single',
    spouseNpcId: null,
    spouseWorkMode: 'active',
    marriedAt: null,
    privateTime: {
      active: false,
      latestAt: null,
      lastActivatedNightKey: null,
    },
    pregnancy: {
      active: false,
      recognized: false,
      confirmed: false,
      symptomsNotified: false,
      startedAt: null,
      recognitionAt: null,
      dueAt: null,
      target: null,
      birthReady: false,
      pendingBirth: null,
    },
    children: [],
  },
  departmentAutomation: {},
  settings: {
    maxPendingReports: 80,
    minPendingReports: 0,
    autoGenerateReports: true,
    reportGenerationIntervalMinutes: 1,
    reportsPerGenerationMin: 1,
    reportsPerGenerationMax: 3,
    dailyReportGenerationLimit: 24,
    reportGenerationDateKey: null,
    reportGeneratedToday: 0,
    standardSlotsGeneratedToday: [],
    counterReportsGeneratedToday: 0,
    autoMissionDailyLimit: 24,
    autoMissionAcceptIntervalMinutes: 0,
    lastAutoReportGeneratedAt: null,
  },
})

const state = reactive(createDefaultState())

export const departmentOptions = DEPARTMENTS
export const weekdayOptions = WEEKDAY_OPTIONS
export const familyStatusLabels = FAMILY_STATUS_LABELS

export const getExecutionModeLabel = (mode) => {
  return EXECUTION_MODE_LABELS[mode] ?? '확인 필요'
}

export const getGenderLabel = (gender) => {
  if (gender === 'female') return '여성'
  if (gender === 'male') return '남성'
  return '미정'
}

export const getDepartmentById = (departmentId) => {
  return DEPARTMENTS.find((department) => department.id === departmentId) ?? DEPARTMENTS[0]
}

export const generateRandomNameParts = () => {
  const surname = getRandomItem(SURNAMES)
  const middleName = getRandomItem(MIDDLE_SYLLABLES)
  const lastName = getRandomItem(LAST_SYLLABLES)
  const givenName = `${middleName}${lastName}`
  const fullName = `${surname}${givenName}`

  return {
    surname,
    middleName,
    lastName,
    givenName,
    fullName,
    editableFullName: fullName,
  }
}

const normalizePersonName = (rawName, fallbackNameParts = generateRandomNameParts()) => {
  const compactName = String(rawName ?? '').replace(/\s+/g, '').trim()
  const safeFullName = compactName || fallbackNameParts.fullName
  const surname = safeFullName.slice(0, 1) || fallbackNameParts.surname
  const givenName = safeFullName.slice(1) || fallbackNameParts.givenName
  const middleName = givenName.slice(0, 1) || fallbackNameParts.middleName
  const lastName = givenName.slice(1) || fallbackNameParts.lastName

  return {
    surname,
    middleName,
    lastName,
    givenName,
    fullName: `${surname}${givenName}`,
    editableFullName: `${surname}${givenName}`,
  }
}

const generateBirthSource = () => {
  const nowYear = standardNow.value.getFullYear()
  const age = getRandomInteger(24, 38)
  const birthYear = nowYear - age + 1

  return {
    birthYear,
    birthMonth: getRandomInteger(1, 12),
    birthDay: getRandomInteger(1, 28),
  }
}

export const createSecretaryCandidate = (departmentId) => {
  const department = getDepartmentById(departmentId)
  const nameParts = generateRandomNameParts()
  const birth = generateBirthSource()
  const gender = getRandomItem(GENDERS)

  return {
    tempId: createId('candidate'),
    departmentId: department.id,
    departmentName: department.label,
    role: department.role,
    gender,
    ...nameParts,
    ...birth,
  }
}

export const createSecretaryCandidates = () => {
  state.pendingSecretaryCandidates = DEPARTMENTS.map((department) => createSecretaryCandidate(department.id))
}

export const rerollSecretaryCandidateName = (tempId) => {
  const candidate = state.pendingSecretaryCandidates.find((item) => item.tempId === tempId)

  if (!candidate) {
    return
  }

  const nextNameParts = generateRandomNameParts()

  Object.assign(candidate, nextNameParts)
}

export const updateSecretaryCandidateName = (tempId, rawName) => {
  const candidate = state.pendingSecretaryCandidates.find((item) => item.tempId === tempId)

  if (!candidate) {
    return
  }

  candidate.editableFullName = String(rawName ?? '')
}

export const rerollSecretaryCandidate = rerollSecretaryCandidateName

export const confirmSecretaryCandidate = (tempId) => {
  const index = state.pendingSecretaryCandidates.findIndex((candidate) => candidate.tempId === tempId)

  if (index < 0) {
    return
  }

  const candidate = state.pendingSecretaryCandidates[index]
  const confirmedName = normalizePersonName(candidate.editableFullName ?? candidate.fullName, candidate)

  state.secretaries.push({
    id: createId('npc'),
    departmentId: candidate.departmentId,
    departmentName: candidate.departmentName,
    role: candidate.role,
    gender: candidate.gender,
    surname: confirmedName.surname,
    middleName: confirmedName.middleName,
    lastName: confirmedName.lastName,
    givenName: confirmedName.givenName,
    fullName: confirmedName.fullName,
    birthYear: candidate.birthYear,
    birthMonth: candidate.birthMonth,
    birthDay: candidate.birthDay,
    workStatus: 'active',
    relation: {
      trust: 0,
      affectionHidden: 0,
      relationState: 'business',
      marriageAvailable: false,
    },
  })

  state.pendingSecretaryCandidates.splice(index, 1)
  createDepartmentAutoAcceptUnlockReport(candidate.departmentId)

  if (state.pendingSecretaryCandidates.length <= 0) {
    if (state.missionReports.length <= 0) {
      fillRandomMissionReports()
    }

    createNextSecretaryUnlockReport()
  }
}

export const confirmAllSecretaryCandidates = () => {
  const ids = state.pendingSecretaryCandidates.map((candidate) => candidate.tempId)
  ids.forEach((id) => confirmSecretaryCandidate(id))
}

export const initializeCompany = (playerDraft) => {
  const surname = String(playerDraft.surname ?? '').trim() || '차'
  const givenName = String(playerDraft.givenName ?? '').trim() || '사장'
  const birthYear = Number(playerDraft.birthYear) || 1995
  const birthMonth = Number(playerDraft.birthMonth) || 1
  const birthDay = Number(playerDraft.birthDay) || 1

  Object.assign(state, createDefaultState())

  state.initialized = true
  state.player = {
    id: 'player',
    surname,
    givenName,
    fullName: `${surname}${givenName}`,
    gender: playerDraft.gender || 'male',
    birthYear,
    birthMonth,
    birthDay,
    title: '사장',
  }

  generateInitialReports()
}


const getNextSecretaryDepartment = () => {
  const index = Number(state.onboarding?.nextSecretaryDepartmentIndex ?? 0)
  return DEPARTMENTS[index] ?? null
}

const hasActiveSecretaryInDepartment = (departmentId) => {
  return state.secretaries.some((secretary) => secretary.departmentId === departmentId && secretary.workStatus === 'active')
}

const hasPendingCandidateInDepartment = (departmentId) => {
  return state.pendingSecretaryCandidates.some((candidate) => candidate.departmentId === departmentId)
}

const hasPendingDepartmentAppointmentReport = (departmentId) => {
  return state.missionReports.some((report) => report.specialAction === 'unlockSecretary' && report.unlockDepartmentId === departmentId)
    || state.scheduledTasks.some((task) => task.specialAction === 'unlockSecretary' && task.unlockDepartmentId === departmentId && !task.completionRecorded)
}

const hasPendingAutoAcceptReport = (departmentId) => {
  return state.missionReports.some((report) => report.specialAction === 'enableDepartmentAutoAccept' && report.departmentId === departmentId)
    || state.scheduledTasks.some((task) => task.specialAction === 'enableDepartmentAutoAccept' && task.departmentId === departmentId && !task.completionRecorded)
}

const getDepartmentAutomation = (departmentId) => {
  state.departmentAutomation = state.departmentAutomation ?? {}

  if (!state.departmentAutomation[departmentId]) {
    state.departmentAutomation[departmentId] = {
      enabled: false,
      unlockedAt: null,
      dateKey: null,
      acceptedToday: 0,
      lastAcceptedAt: null,
    }
  }

  return state.departmentAutomation[departmentId]
}

const resetDailyReportGenerationIfNeeded = () => {
  const todayKey = getDateKey(standardNow.value)

  if (state.settings.reportGenerationDateKey !== todayKey) {
    state.settings.reportGenerationDateKey = todayKey
    state.settings.reportGeneratedToday = 0
    state.settings.standardSlotsGeneratedToday = []
    state.settings.counterReportsGeneratedToday = 0
  }

  state.settings.standardSlotsGeneratedToday = state.settings.standardSlotsGeneratedToday ?? []
  state.settings.counterReportsGeneratedToday = Number(state.settings.counterReportsGeneratedToday ?? 0)
}

const isWeekdayReportDay = (date = standardNow.value) => {
  return WEEKDAY_REPORT_DAYS.includes(date.getDay())
}

const getSlotDateForToday = (slot, baseDate = standardNow.value) => {
  const [hourText, minuteText] = String(slot).split(':')
  const date = new Date(baseDate)
  date.setHours(Number(hourText), Number(minuteText), 0, 0)
  return date
}

const getAvailableStandardGrantSlots = () => {
  resetDailyReportGenerationIfNeeded()

  if (!isWeekdayReportDay()) {
    return []
  }

  const now = standardNow.value
  const generatedSlots = new Set(state.settings.standardSlotsGeneratedToday ?? [])

  return STANDARD_REPORT_GRANT_TIMES.filter((slot) => {
    if (generatedSlots.has(slot)) {
      return false
    }

    return now.getTime() >= getSlotDateForToday(slot, now).getTime()
  })
}

const canGenerateCounterReportToday = () => {
  resetDailyReportGenerationIfNeeded()

  if (state.secretaries.length <= 0) {
    return true
  }

  if (!isWeekdayReportDay()) {
    return false
  }

  return Number(state.settings.counterReportsGeneratedToday ?? 0) < DAILY_COUNTER_REPORT_LIMIT_AFTER_SECRETARY
}

const markStandardSlotGenerated = (slot) => {
  resetDailyReportGenerationIfNeeded()

  if (!state.settings.standardSlotsGeneratedToday.includes(slot)) {
    state.settings.standardSlotsGeneratedToday.push(slot)
    state.settings.reportGeneratedToday = Number(state.settings.reportGeneratedToday ?? 0) + 1
  }
}

const markCounterReportGenerated = () => {
  resetDailyReportGenerationIfNeeded()
  state.settings.counterReportsGeneratedToday = Number(state.settings.counterReportsGeneratedToday ?? 0) + 1
  state.settings.reportGeneratedToday = Number(state.settings.reportGeneratedToday ?? 0) + 1
}


const canCreateSecretaryUnlockReport = () => {
  if (state.secretaries.length > 0) {
    return true
  }

  return Number(state.onboarding?.userAcceptedBeforeSecretary ?? 0) >= Number(state.onboarding?.secretaryUnlockThreshold ?? 100)
}

const hasPendingSecretaryUnlockReport = () => {
  return state.missionReports.some((report) => report.specialAction === 'unlockSecretary')
    || state.scheduledTasks.some((task) => task.specialAction === 'unlockSecretary' && !task.completionRecorded)
}

export const createNextSecretaryUnlockReport = () => {
  if (!state.initialized) {
    return null
  }

  if (!canCreateSecretaryUnlockReport()) {
    return null
  }

  if (state.pendingSecretaryCandidates.length > 0 || hasPendingSecretaryUnlockReport()) {
    return null
  }

  const department = getNextSecretaryDepartment()

  if (!department) {
    return null
  }

  const isFirstSecretary = state.secretaries.length <= 0
  const durationMinutes = isFirstSecretary ? 30 : getRandomInteger(6, 12) * 60
  const projectName = isFirstSecretary
    ? '첫 비서 초빙 준비 업무'
    : `${department.label} ${department.role} 초빙 준비 업무`

  const report = {
    id: createId('report'),
    departmentId: department.id,
    departmentName: department.label,
    secretaryId: null,
    secretaryName: isFirstSecretary ? `${state.player?.fullName ?? '사장'} 직접 수행` : '비서실 임시 보고',
    role: isFirstSecretary ? '사장' : '임시 보고',
    projectName,
    reportText: isFirstSecretary
      ? '사장님, 첫 비서 초빙 준비 업무가 발생했습니다.'
      : `사장님, ${department.role} 초빙 준비 업무가 발생했습니다.`,
    contextText: '',
    missionType: '초빙형',
    executionMode: 'counter',
    durationMinutes,
    createdAt: standardNow.value.toISOString(),
    priority: '중요',
    specialAction: 'unlockSecretary',
    unlockDepartmentId: department.id,
  }

  state.missionReports.unshift(report)
  state.missionReports = state.missionReports.slice(0, state.settings.maxPendingReports)
  return report
}

const createProjectName = (department) => {
  const object = getRandomItem(department.objects)
  const action = getRandomItem(department.actions)
  const ending = getRandomItem(department.endings)

  return `${object} ${action} ${ending}`
}

const createReportText = ({ departmentName, projectName }) => {
  const template = getRandomItem(REPORT_TEMPLATES)

  return template
    .replaceAll('{departmentName}', departmentName)
    .replaceAll('{projectName}', projectName)
}

const createExecutionMode = () => {
  return getWeightedRandomItem(EXECUTION_MODES).value
}

const createMissionType = (executionMode = 'counter') => {
  if (executionMode === 'counter') {
    return getWeightedRandomItem(COUNTER_MISSION_TYPES)
  }

  return getWeightedRandomItem(STANDARD_MISSION_TYPES)
}

const createDurationMinutes = (missionType = null, executionMode = 'counter') => {
  const type = missionType ?? createMissionType(executionMode)

  if (executionMode === 'counter') {
    return getRandomInteger(type.minMinutes, type.maxMinutes)
  }

  return getRandomInteger(type.minHours, type.maxHours) * 60
}

const getNextAutoStandardDate = (departmentId) => {
  const now = standardNow.value
  const candidates = []

  for (let dayOffset = 0; dayOffset <= 14; dayOffset += 1) {
    const base = new Date(now)
    base.setDate(now.getDate() + dayOffset)

    if (!isWeekdayReportDay(base)) {
      continue
    }

    for (const slot of STANDARD_REPORT_GRANT_TIMES) {
      const candidate = getSlotDateForToday(slot, base)

      if (candidate.getTime() > now.getTime() + 5 * 60000) {
        candidates.push(candidate)
      }
    }
  }

  candidates.sort((a, b) => a.getTime() - b.getTime())
  return candidates[0] ?? addMinutes(now, 60)
}

const createStarterExecutionMode = () => {
  return getWeightedRandomItem(STARTER_EXECUTION_MODES).value
}

export const generateStarterMissionReport = () => {
  if (!state.initialized) {
    return null
  }

  if (state.secretaries.length > 0) {
    return null
  }

  const acceptedBeforeSecretary = Number(state.onboarding?.userAcceptedBeforeSecretary ?? 0)
  const unlockThreshold = Number(state.onboarding?.secretaryUnlockThreshold ?? 100)

  if (acceptedBeforeSecretary >= unlockThreshold) {
    createNextSecretaryUnlockReport()
    return null
  }

  const department = getDepartmentById('executive')
  const projectName = createProjectName(department)
  const executionMode = 'counter'
  const missionType = createMissionType(executionMode)
  const durationMinutes = createDurationMinutes(missionType, executionMode)
  const report = {
    id: createId('report'),
    departmentId: department.id,
    departmentName: '사장실',
    secretaryId: null,
    secretaryName: `${state.player?.fullName ?? '사장'} 직접 수행`,
    role: '사장',
    projectName,
    reportText: `사장님, ${projectName} 업무가 접수되었습니다.`,
    contextText: '',
    missionType: missionType.label,
    executionMode,
    durationMinutes,
    createdAt: standardNow.value.toISOString(),
    priority: missionType.priority,
    starterMission: true,
  }

  state.missionReports.unshift(report)
  state.missionReports = state.missionReports.slice(0, state.settings.maxPendingReports)

  return report
}

export const generateMissionReport = (departmentId = null, forcedExecutionMode = null) => {
  if (!state.initialized) {
    return null
  }

  if (state.secretaries.length <= 0) {
    return generateStarterMissionReport()
  }

  const availableSecretaries = state.secretaries.filter((secretary) => {
    if (secretary.workStatus !== 'active') {
      return false
    }

    if (departmentId && secretary.departmentId !== departmentId) {
      return false
    }

    return true
  })

  if (availableSecretaries.length <= 0) {
    return null
  }

  const secretary = getRandomItem(availableSecretaries)
  const department = getDepartmentById(secretary.departmentId)
  const projectName = createProjectName(department)
  const executionMode = forcedExecutionMode ?? createExecutionMode()
  const missionType = createMissionType(executionMode)
  const durationMinutes = createDurationMinutes(missionType, executionMode)
  const contextText = getRandomItem(MISSION_CONTEXTS)

  const report = {
    id: createId('report'),
    departmentId: department.id,
    departmentName: department.label,
    secretaryId: secretary.id,
    secretaryName: secretary.fullName,
    projectName,
    reportText: createReportText({ departmentName: department.label, projectName }),
    contextText,
    missionType: missionType.label,
    executionMode,
    durationMinutes,
    createdAt: standardNow.value.toISOString(),
    priority: missionType.priority,
  }

  state.missionReports.unshift(report)
  state.missionReports = state.missionReports.slice(0, state.settings.maxPendingReports)

  return report
}

export const generateRandomMissionReports = (count = 3) => {
  if (!state.initialized) {
    return []
  }

  const safeCount = Math.max(1, Math.min(Number(count) || 1, state.settings.maxPendingReports))
  const createdReports = []

  for (let index = 0; index < safeCount; index += 1) {
    if (state.missionReports.length >= state.settings.maxPendingReports) {
      break
    }

    const report = generateMissionReport()

    if (report) {
      createdReports.push(report)
    }
  }

  return createdReports
}

export const fillRandomMissionReports = () => {
  const target = Math.min(state.settings.minPendingReports, state.settings.maxPendingReports)
  const needCount = Math.max(0, target - state.missionReports.length)

  if (needCount <= 0) {
    return []
  }

  return generateRandomMissionReports(needCount)
}

export const generateInitialReports = () => {
  if (state.missionReports.length > 0) {
    return []
  }

  const createdReports = []
  const firstReport = state.secretaries.length <= 0
    ? generateStarterMissionReport()
    : generateMissionReport()

  if (firstReport) {
    createdReports.push(firstReport)
  }

  createNextSecretaryUnlockReport()
  state.settings.lastAutoReportGeneratedAt = standardNow.value.toISOString()

  return createdReports
}

export const ensureRandomMissionReports = () => {
  if (!state.settings.autoGenerateReports || !state.initialized) {
    return []
  }

  processDepartmentAutoAccepts()

  if (state.pendingSecretaryCandidates.length > 0) {
    return []
  }

  if (state.missionReports.length >= state.settings.maxPendingReports) {
    return []
  }

  const now = standardNow.value
  const lastGeneratedAt = state.settings.lastAutoReportGeneratedAt
    ? new Date(state.settings.lastAutoReportGeneratedAt)
    : null
  const elapsedMinutes = lastGeneratedAt
    ? Math.floor((now.getTime() - lastGeneratedAt.getTime()) / 60000)
    : Number.POSITIVE_INFINITY

  const createdReports = []

  if (state.secretaries.length <= 0) {
    if (elapsedMinutes >= state.settings.reportGenerationIntervalMinutes) {
      const report = generateStarterMissionReport()

      if (report) {
        createdReports.push(report)
      }

      state.settings.lastAutoReportGeneratedAt = now.toISOString()
    }

    return createdReports
  }

  if (!isWeekdayReportDay(now)) {
    state.settings.lastAutoReportGeneratedAt = now.toISOString()
    return createdReports
  }

  const inboxRemainingBeforeStandard = Math.max(0, state.settings.maxPendingReports - state.missionReports.length)
  const availableSlots = getAvailableStandardGrantSlots().slice(0, inboxRemainingBeforeStandard)

  for (const slot of availableSlots) {
    const report = generateMissionReport(null, 'secretary-standard')

    if (report) {
      markStandardSlotGenerated(slot)
      createdReports.push(report)
    }
  }

  const inboxRemaining = Math.max(0, state.settings.maxPendingReports - state.missionReports.length)

  if (inboxRemaining > 0 && elapsedMinutes >= state.settings.reportGenerationIntervalMinutes && canGenerateCounterReportToday()) {
    const report = generateMissionReport(null, 'counter')

    if (report) {
      markCounterReportGenerated()
      createdReports.push(report)
    }

    state.settings.lastAutoReportGeneratedAt = now.toISOString()
  }

  processDepartmentAutoAccepts()
  return createdReports
}

export const refreshRandomMissionReports = () => {
  if (!state.initialized) {
    return []
  }

  state.missionReports = []

  const createdReports = generateInitialReports()
  createNextSecretaryUnlockReport()
  state.settings.lastAutoReportGeneratedAt = standardNow.value.toISOString()

  return [...createdReports]
}

export const dismissMissionReport = (reportId) => {
  const reportIndex = state.missionReports.findIndex((report) => report.id === reportId)

  if (reportIndex >= 0) {
    state.missionReports.splice(reportIndex, 1)
  }
}


const markMissionAccepted = (task) => {
  if (!task || task.specialAction) {
    return
  }

  state.stats.totalAcceptedMissions = Number(state.stats.totalAcceptedMissions ?? 0) + 1

  if (!task.secretaryId) {
    state.stats.totalUserAcceptedMissions = Number(state.stats.totalUserAcceptedMissions ?? 0) + 1
  }

  if (state.secretaries.length <= 0) {
    state.onboarding.userAcceptedBeforeSecretary = Number(state.onboarding.userAcceptedBeforeSecretary ?? 0) + 1

    const acceptedBeforeSecretary = Number(state.onboarding.userAcceptedBeforeSecretary ?? 0)
    const unlockThreshold = Number(state.onboarding.secretaryUnlockThreshold ?? 100)

    if (acceptedBeforeSecretary >= unlockThreshold) {
      state.missionReports = state.missionReports.filter((report) => report.starterMission !== true)
      createNextSecretaryUnlockReport()
    }
  }
}

const createScheduledTaskFromReport = ({ report, startAt, source }) => {
  const endAt = addMinutes(startAt, report.durationMinutes)

  return {
    id: createId('task'),
    reportId: report.id,
    departmentId: report.departmentId,
    departmentName: report.departmentName,
    secretaryId: report.secretaryId,
    secretaryName: report.secretaryName,
    role: report.role ?? getSecretaryById(report.secretaryId)?.role ?? '비서',
    projectName: report.projectName,
    reportText: report.reportText,
    contextText: report.contextText,
    missionType: report.missionType,
    executionMode: report.executionMode ?? 'counter',
    durationMinutes: report.durationMinutes,
    priority: report.priority,
    specialAction: report.specialAction ?? null,
    unlockDepartmentId: report.unlockDepartmentId ?? null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    scheduledAt: new Date().toISOString(),
    scheduleSource: source,
    completionRecorded: false,
  }
}

export const scheduleMissionReport = ({ reportId, weekday, startTime }) => {
  const reportIndex = state.missionReports.findIndex((report) => report.id === reportId)

  if (reportIndex < 0) {
    return null
  }

  const report = state.missionReports[reportIndex]
  const startAt = getNextScheduledDate({ weekday, startTime })
  const task = createScheduledTaskFromReport({ report, startAt, source: 'user-standard' })

  state.scheduledTasks.push(task)
  state.missionReports.splice(reportIndex, 1)
  markMissionAccepted(task)

  return task
}

export const startCounterMissionReport = (reportId) => {
  const reportIndex = state.missionReports.findIndex((report) => report.id === reportId)

  if (reportIndex < 0) {
    return null
  }

  const report = state.missionReports[reportIndex]
  const startAt = new Date(standardNow.value)
  const task = createScheduledTaskFromReport({
    report: {
      ...report,
      executionMode: 'counter',
    },
    startAt,
    source: 'counter',
  })

  state.scheduledTasks.push(task)
  state.missionReports.splice(reportIndex, 1)
  markMissionAccepted(task)

  return task
}

export const autoScheduleMissionReport = (reportId) => {
  const reportIndex = state.missionReports.findIndex((report) => report.id === reportId)

  if (reportIndex < 0) {
    return null
  }

  const report = state.missionReports[reportIndex]
  const startAt = new Date(standardNow.value)
  const task = createScheduledTaskFromReport({
    report: {
      ...report,
      executionMode: 'secretary-standard',
    },
    startAt,
    source: 'secretary-standard',
  })

  state.scheduledTasks.push(task)
  state.missionReports.splice(reportIndex, 1)
  markMissionAccepted(task)

  return task
}

export const cancelScheduledTask = (taskId) => {
  const index = state.scheduledTasks.findIndex((task) => task.id === taskId)

  if (index < 0) {
    return
  }

  state.scheduledTasks.splice(index, 1)
}

export const recordCompletedTasks = () => {
  state.scheduledTasks.forEach((task) => {
    if (task.completionRecorded) {
      return
    }

    if (getTaskStatusByTime(task) !== 'completed') {
      return
    }

    task.completionRecorded = true

    state.completedReports.unshift({
      id: createId('complete'),
      taskId: task.id,
      departmentName: task.departmentName,
      secretaryName: task.secretaryName,
      projectName: task.projectName,
      completedAt: task.endAt,
      text: task.specialAction === 'unlockSecretary'
        ? `${task.projectName}가 완료되었습니다. 이제 ${task.departmentName} 비서 후보를 확인할 수 있습니다.`
        : `${task.secretaryName} ${task.role}가 ${task.projectName} 완료를 보고했습니다.`,
    })

    if (task.specialAction === 'unlockSecretary') {
      unlockSecretaryCandidate(task.unlockDepartmentId)
    }

    if (task.specialAction === 'enableDepartmentAutoAccept') {
      enableDepartmentAutoAccept(task.departmentId)
    }
  })

  state.completedReports = state.completedReports.slice(0, 80)
}


export const unlockSecretaryCandidate = (departmentId) => {
  const department = getDepartmentById(departmentId)

  if (!department) {
    return null
  }

  const alreadyConfirmed = hasActiveSecretaryInDepartment(department.id)
  const alreadyPending = hasPendingCandidateInDepartment(department.id)

  if (alreadyConfirmed || alreadyPending) {
    return null
  }

  const candidate = createSecretaryCandidate(department.id)
  state.pendingSecretaryCandidates.push(candidate)

  const currentIndex = Number(state.onboarding?.nextSecretaryDepartmentIndex ?? 0)
  const currentDepartment = DEPARTMENTS[currentIndex]

  if (currentDepartment?.id === department.id) {
    state.onboarding.nextSecretaryDepartmentIndex = currentIndex + 1
  }

  return candidate
}


export const createDepartmentAppointmentReport = (departmentId) => {
  if (!state.initialized) {
    return null
  }

  const department = getDepartmentById(departmentId)

  if (!department || hasActiveSecretaryInDepartment(department.id) || hasPendingCandidateInDepartment(department.id) || hasPendingDepartmentAppointmentReport(department.id)) {
    return null
  }

  const report = {
    id: createId('report'),
    departmentId: department.id,
    departmentName: department.label,
    secretaryId: null,
    secretaryName: '공석 처리 업무',
    role: '임명 업무',
    projectName: `${department.label} 후임 ${department.role} 임명 업무`,
    reportText: `사장님, ${department.label} 자리가 공석입니다. 후임 ${department.role} 임명 업무가 필요합니다.`,
    contextText: '',
    missionType: '임명형',
    executionMode: 'counter',
    durationMinutes: 30,
    createdAt: standardNow.value.toISOString(),
    priority: '중요',
    specialAction: 'unlockSecretary',
    unlockDepartmentId: department.id,
  }

  state.missionReports.unshift(report)
  state.missionReports = state.missionReports.slice(0, state.settings.maxPendingReports)
  return report
}

export const createDepartmentAutoAcceptUnlockReport = (departmentId) => {
  if (!state.initialized) {
    return null
  }

  const department = getDepartmentById(departmentId)
  const automation = getDepartmentAutomation(department.id)

  if (!department || !hasActiveSecretaryInDepartment(department.id) || automation.enabled || hasPendingAutoAcceptReport(department.id)) {
    return null
  }

  const secretary = state.secretaries.find((item) => item.departmentId === department.id && item.workStatus === 'active')
  const report = {
    id: createId('report'),
    departmentId: department.id,
    departmentName: department.label,
    secretaryId: secretary?.id ?? null,
    secretaryName: secretary?.fullName ?? department.role,
    role: department.role,
    projectName: `${department.label} 자동임무 수락 체계 준비`,
    reportText: `사장님, ${department.label} 자동임무 수락 체계를 준비할 수 있습니다.`,
    contextText: '',
    missionType: '자동화 준비형',
    executionMode: 'secretary-standard',
    durationMinutes: 1440,
    createdAt: standardNow.value.toISOString(),
    priority: '장기',
    specialAction: 'enableDepartmentAutoAccept',
  }

  state.missionReports.unshift(report)
  state.missionReports = state.missionReports.slice(0, state.settings.maxPendingReports)
  return report
}

export const enableDepartmentAutoAccept = (departmentId) => {
  const automation = getDepartmentAutomation(departmentId)
  automation.enabled = true
  automation.unlockedAt = standardNow.value.toISOString()
  automation.dateKey = getDateKey(standardNow.value)
  automation.acceptedToday = 0
  automation.lastAcceptedAt = null
  return automation
}

const processDepartmentAutoAccepts = () => {
  if (!state.initialized || state.secretaries.length <= 0) {
    return []
  }

  const accepted = []
  const now = standardNow.value
  const todayKey = getDateKey(now)
  const dailyLimit = Number(state.settings.autoMissionDailyLimit ?? 24)
  const intervalMinutes = Number(state.settings.autoMissionAcceptIntervalMinutes ?? 0)

  for (const secretary of state.secretaries) {
    if (secretary.workStatus !== 'active') {
      continue
    }

    const automation = getDepartmentAutomation(secretary.departmentId)

    if (!automation.enabled) {
      continue
    }

    if (automation.dateKey !== todayKey) {
      automation.dateKey = todayKey
      automation.acceptedToday = 0
      automation.lastAcceptedAt = null
    }

    let acceptedToday = Number(automation.acceptedToday ?? 0)

    while (acceptedToday < dailyLimit) {
      const lastAcceptedAt = automation.lastAcceptedAt ? new Date(automation.lastAcceptedAt) : null
      const elapsedMinutes = lastAcceptedAt
        ? Math.floor((now.getTime() - lastAcceptedAt.getTime()) / 60000)
        : Number.POSITIVE_INFINITY

      if (elapsedMinutes < intervalMinutes) {
        break
      }

      const report = state.missionReports.find((item) => item.departmentId === secretary.departmentId && !item.specialAction)

      if (!report) {
        break
      }

      const task = report.executionMode === 'secretary-standard'
        ? autoScheduleMissionReport(report.id)
        : startCounterMissionReport(report.id)

      if (!task) {
        break
      }

      acceptedToday += 1
      automation.acceptedToday = acceptedToday
      automation.lastAcceptedAt = now.toISOString()
      accepted.push(task)
    }
  }

  return accepted
}

export const getTaskStatusLabel = (task) => {
  const status = getTaskStatusByTime(task)

  if (status === 'reserved') return '예약됨'
  if (status === 'running') return '진행 중'
  if (status === 'completed') return '완료'
  return '확인 필요'
}

export const getDurationText = (minutes) => {
  const totalMinutes = Number(minutes || 0)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const restMinutes = totalMinutes % 60

  if (days > 0) {
    return `${days}일 ${hours}시간`
  }

  if (hours > 0) {
    return `${hours}시간 ${restMinutes}분`
  }

  return `${restMinutes}분`
}

export const getSecretaryById = (secretaryId) => {
  return state.secretaries.find((secretary) => secretary.id === secretaryId) ?? null
}

const createEmptyPregnancyState = () => ({
  active: false,
  recognized: false,
  confirmed: false,
  symptomsNotified: false,
  startedAt: null,
  recognitionAt: null,
  dueAt: null,
  target: null,
  birthReady: false,
  pendingBirth: null,
})

const ensureFamilyState = () => {
  if (!state.family) {
    state.family = createDefaultState().family
  }

  state.family.privateTime = {
    active: false,
    latestAt: null,
    lastActivatedNightKey: null,
    ...(state.family.privateTime ?? {}),
  }

  state.family.pregnancy = {
    ...createEmptyPregnancyState(),
    ...(state.family.pregnancy ?? {}),
  }

  state.family.children = state.family.children ?? []
}

const getPregnancyTarget = () => {
  const spouse = getSecretaryById(state.family.spouseNpcId)

  if (!state.player || !spouse) {
    return null
  }

  if (state.player.gender === 'female') {
    return 'player'
  }

  if (spouse.gender === 'female') {
    return 'spouse'
  }

  return null
}

const startPregnancy = (startedAt, target) => {
  ensureFamilyState()

  const startedDate = startedAt instanceof Date ? new Date(startedAt) : new Date(startedAt)
  const recognitionDate = addDays(startedDate, PREGNANCY_RECOGNITION_DAYS)
  const dueDate = addDays(startedDate, PREGNANCY_DUE_DAYS)

  state.family.pregnancy = {
    active: true,
    recognized: false,
    confirmed: false,
    symptomsNotified: false,
    startedAt: startedDate.toISOString(),
    recognitionAt: recognitionDate.toISOString(),
    dueAt: dueDate.toISOString(),
    target,
    birthReady: false,
    pendingBirth: null,
  }

  return state.family.pregnancy
}

const getPrivateTimeCooldownRemainingMs = () => {
  const latestAt = state.family?.privateTime?.latestAt

  if (!latestAt) {
    return 0
  }

  const nextAvailableAt = new Date(latestAt).getTime() + PRIVATE_TIME_COOLDOWN_HOURS * 60 * 60 * 1000
  return Math.max(0, nextAvailableAt - standardNow.value.getTime())
}

const getCooldownText = (milliseconds) => {
  const totalMinutes = Math.ceil(milliseconds / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }

  return `${minutes}분`
}

export const canActivatePrivateTimeNow = () => {
  ensureFamilyState()

  if (state.family.status !== 'married' || !state.family.spouseNpcId) {
    return false
  }

  return getPrivateTimeCooldownRemainingMs() <= 0
}

export const getPrivateTimeAvailabilityText = () => {
  ensureFamilyState()

  if (state.family.status !== 'married') {
    return '배우자 지정 후 활성화됩니다.'
  }

  const remainingMs = getPrivateTimeCooldownRemainingMs()

  if (remainingMs > 0) {
    return `다음 개인 시간까지 ${getCooldownText(remainingMs)} 남았습니다.`
  }

  return '개인 시간을 활성화할 수 있습니다.'
}

export const activatePrivateTimeNow = () => {
  ensureFamilyState()

  if (!canActivatePrivateTimeNow()) {
    return false
  }

  const eventAt = new Date(standardNow.value)
  state.family.privateTime.latestAt = eventAt.toISOString()
  state.family.privateTime.lastActivatedNightKey = getDateKey(eventAt)

  if (!state.family.pregnancy.active) {
    const target = getPregnancyTarget()

    if (target && Math.random() < PREGNANCY_CHANCE_PER_PRIVATE_TIME) {
      startPregnancy(eventAt, target)
    }
  }

  processPregnancyLifecycle()
  return true
}

const processPrivateTimeLifecycle = () => {
  ensureFamilyState()
}

const processPregnancyLifecycle = () => {
  ensureFamilyState()

  const pregnancy = state.family.pregnancy

  if (!pregnancy.active) {
    return
  }

  const nowTime = standardNow.value.getTime()
  const recognitionTime = new Date(pregnancy.recognitionAt).getTime()
  const dueTime = new Date(pregnancy.dueAt).getTime()

  if (Number.isFinite(recognitionTime) && nowTime >= recognitionTime) {
    if (pregnancy.target === 'spouse') {
      pregnancy.recognized = true
      pregnancy.confirmed = true
    }

    if (pregnancy.target === 'player') {
      pregnancy.symptomsNotified = true
    }
  }

  if (Number.isFinite(dueTime) && nowTime >= dueTime) {
    pregnancy.recognized = true
    pregnancy.confirmed = true
    pregnancy.birthReady = true

    if (!pregnancy.pendingBirth) {
      pregnancy.pendingBirth = {
        gender: getRandomItem(GENDERS),
        readyAt: standardNow.value.toISOString(),
      }
    }
  }
}

export const updateFamilyLifecycle = () => {
  processPrivateTimeLifecycle()
  processPregnancyLifecycle()
}

export const marrySecretary = ({ secretaryId, spouseWorkMode = 'active' }) => {
  const secretary = getSecretaryById(secretaryId)

  if (!secretary || state.family.status === 'married') {
    return false
  }

  ensureFamilyState()

  state.family.status = 'married'
  state.family.spouseNpcId = secretary.id
  state.family.spouseWorkMode = spouseWorkMode
  state.family.marriedAt = standardNow.value.toISOString()
  state.family.privateTime.active = true
  state.family.privateTime.lastActivatedNightKey = null
  secretary.relation.relationState = 'spouse'

  if (spouseWorkMode === 'family') {
    secretary.workStatus = 'family'
    createDepartmentAppointmentReport(secretary.departmentId)
  }

  state.secretaries.forEach((npc) => {
    if (npc.id !== secretary.id) {
      npc.relation.affectionHidden = 0
      npc.relation.marriageAvailable = false
    }
  })

  updateFamilyLifecycle()

  return true
}

export const setSpouseWorkMode = (spouseWorkMode) => {
  const spouse = getSecretaryById(state.family.spouseNpcId)

  if (!spouse) {
    return
  }

  state.family.spouseWorkMode = spouseWorkMode
  spouse.workStatus = spouseWorkMode === 'family' ? 'family' : 'active'

  if (spouseWorkMode === 'family') {
    createDepartmentAppointmentReport(spouse.departmentId)
  }
}

export const confirmPlayerPregnancyVisit = () => {
  ensureFamilyState()

  if (!state.family.pregnancy.active || state.family.pregnancy.target !== 'player') {
    return false
  }

  if (!state.family.pregnancy.symptomsNotified) {
    return false
  }

  state.family.pregnancy.recognized = true
  state.family.pregnancy.confirmed = true

  return true
}

export const getFatherSurnameForChild = () => {
  if (!state.player) {
    return '김'
  }

  if (state.player.gender === 'male') {
    return state.player.surname
  }

  const spouse = getSecretaryById(state.family.spouseNpcId)
  return spouse?.surname ?? state.player.surname
}

export const finalizeChildBirth = ({ givenName }) => {
  ensureFamilyState()
  updateFamilyLifecycle()

  const pregnancy = state.family.pregnancy

  if (!pregnancy.active || !pregnancy.birthReady || !pregnancy.pendingBirth) {
    return null
  }

  const fatherSurname = getFatherSurnameForChild()
  const now = standardNow.value
  const child = {
    id: createId('child'),
    fatherSurname,
    givenName: String(givenName ?? '').trim() || '아이',
    gender: pregnancy.pendingBirth.gender || getRandomItem(GENDERS),
    birthYear: now.getFullYear(),
    birthMonth: now.getMonth() + 1,
    birthDay: now.getDate(),
  }

  state.family.children.push(child)
  state.family.lastBirthAt = now.toISOString()
  state.family.pregnancy = createEmptyPregnancyState()

  return child
}

export const getPregnancyWeek = () => {
  const startedAt = state.family?.pregnancy?.startedAt

  if (!startedAt) {
    return 0
  }

  const started = new Date(startedAt).getTime()
  const now = standardNow.value.getTime()

  if (!Number.isFinite(started) || now < started) {
    return 0
  }

  return Math.min(40, Math.floor((now - started) / (7 * 24 * 60 * 60 * 1000)) + 1)
}

export const getPregnancyProgressPercent = () => {
  const pregnancy = state.family?.pregnancy

  if (!pregnancy?.startedAt || !pregnancy?.dueAt) {
    return 0
  }

  const started = new Date(pregnancy.startedAt).getTime()
  const due = new Date(pregnancy.dueAt).getTime()
  const now = standardNow.value.getTime()

  if (!Number.isFinite(started) || !Number.isFinite(due) || due <= started) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.floor(((now - started) / (due - started)) * 100)))
}

export const addChild = ({ givenName, gender }) => {
  const fatherSurname = getFatherSurnameForChild()
  const now = standardNow.value

  state.family.children.push({
    id: createId('child'),
    fatherSurname,
    givenName: String(givenName ?? '').trim() || '아이',
    gender: gender || getRandomItem(GENDERS),
    birthYear: now.getFullYear(),
    birthMonth: now.getMonth() + 1,
    birthDay: now.getDate(),
  })
}

export const getProgressPercent = (task) => {
  return getProgressPercentByTime(task)
}

export const stateSummary = computed(() => {
  recordCompletedTasks()
  ensureRandomMissionReports()
  updateFamilyLifecycle()

  const reserved = state.scheduledTasks.filter((task) => getTaskStatusByTime(task) === 'reserved')
  const running = state.scheduledTasks.filter((task) => getTaskStatusByTime(task) === 'running')
  const completed = state.scheduledTasks.filter((task) => getTaskStatusByTime(task) === 'completed')

  return {
    pendingReports: state.missionReports.length,
    counterReports: state.missionReports.filter((report) => (report.executionMode ?? 'counter') === 'counter').length,
    standardReports: state.missionReports.filter((report) => (report.executionMode ?? 'counter') !== 'counter').length,
    reservedTasks: reserved.length,
    runningTasks: running.length,
    completedTasks: completed.length,
    secretaries: state.secretaries.length,
    acceptedBeforeSecretary: Number(state.onboarding?.userAcceptedBeforeSecretary ?? 0),
    secretaryUnlockThreshold: Number(state.onboarding?.secretaryUnlockThreshold ?? 100),
    remainingUntilSecretaryUnlock: Math.max(0, Number(state.onboarding?.secretaryUnlockThreshold ?? 100) - Number(state.onboarding?.userAcceptedBeforeSecretary ?? 0)),
    totalAcceptedMissions: Number(state.stats?.totalAcceptedMissions ?? 0),
    familyStatus: FAMILY_STATUS_LABELS[state.family.status] ?? state.family.status,
  }
})

export const randomMissionReports = computed(() => {
  ensureRandomMissionReports()

  return [...state.missionReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const sortBySoonestFinish = (tasks) => {
  return [...tasks].sort((a, b) => {
    const endDiff = new Date(a.endAt).getTime() - new Date(b.endAt).getTime()

    if (endDiff !== 0) {
      return endDiff
    }

    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  })
}

export const upcomingTasks = computed(() => {
  recordCompletedTasks()

  return sortBySoonestFinish(
    state.scheduledTasks.filter((task) => getTaskStatusByTime(task) !== 'completed'),
  )
})

export const runningTasks = computed(() => {
  return sortBySoonestFinish(
    state.scheduledTasks.filter((task) => getTaskStatusByTime(task) === 'running'),
  )
})

export const getAge = (person) => {
  return getKoreanAgeFromBirthYear(person?.birthYear)
}

export const getTaskDateText = (task) => {
  return `${formatDateTime(task.startAt)} ~ ${formatDateTime(task.endAt)}`
}

export const getTerrariaSnapshot = () => clonePlain(state)

export const restoreTerrariaSnapshot = (snapshot) => {
  const nextState = snapshot && typeof snapshot === 'object' ? snapshot : createDefaultState()
  const defaultState = createDefaultState()
  const mergedState = {
    ...defaultState,
    ...nextState,
    onboarding: {
      ...defaultState.onboarding,
      ...(nextState.onboarding ?? {}),
    },
    stats: {
      ...defaultState.stats,
      ...(nextState.stats ?? {}),
    },
    departmentAutomation: {
      ...defaultState.departmentAutomation,
      ...(nextState.departmentAutomation ?? {}),
    },
    family: {
      ...defaultState.family,
      ...(nextState.family ?? {}),
      privateTime: {
        ...defaultState.family.privateTime,
        ...(nextState.family?.privateTime ?? {}),
      },
      pregnancy: {
        ...defaultState.family.pregnancy,
        ...(nextState.family?.pregnancy ?? {}),
      },
      children: nextState.family?.children ?? [],
    },
    settings: {
      ...defaultState.settings,
      ...(nextState.settings ?? {}),
    },
  }


  mergedState.onboarding.secretaryUnlockThreshold = 100
  mergedState.settings.standardSlotsGeneratedToday = mergedState.settings.standardSlotsGeneratedToday ?? []
  mergedState.settings.counterReportsGeneratedToday = Number(mergedState.settings.counterReportsGeneratedToday ?? 0)
  mergedState.settings.dailyReportGenerationLimit = 24
  mergedState.settings.autoMissionDailyLimit = 24

  mergedState.missionReports = (mergedState.missionReports ?? []).map((report) => ({
    ...report,
    executionMode: report.executionMode === 'user-standard' ? 'counter' : (report.executionMode ?? 'counter'),
  }))

  mergedState.pendingSecretaryCandidates = (mergedState.pendingSecretaryCandidates ?? []).map((candidate) => ({
    ...candidate,
    editableFullName: candidate.editableFullName ?? candidate.fullName ?? `${candidate.surname ?? ''}${candidate.givenName ?? ''}`,
  }))

  Object.assign(state, mergedState)
  updateFamilyLifecycle()
}

export const resetTerrariaState = () => {
  Object.assign(state, createDefaultState())
}

export const restartCompany = () => {
  resetTerrariaState()
}

export const terrariaState = state
