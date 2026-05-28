// src/stores/rctsStore.js

import { computed, ref } from 'vue'

const DB_NAME = 'rcts-local-db'
const DB_VERSION = 1
const STORE_NAME = 'rcts-state'
const SAVE_KEY = 'main'

const company = ref(null)
const staffList = ref([])
const menusUnlocked = ref(false)
const savingUnlocked = ref(false)
const storeLoaded = ref(false)
const systemSecretaryStaffId = ref('')

const departments = [
  {
    id: 'system',
    departmentName: '시스템부',
    menuName: '시스템',
    path: '/system',
  },
  {
    id: 'staff',
    departmentName: '인사부',
    menuName: '직원',
    path: '/staff',
  },
  {
    id: 'transport',
    departmentName: '교통부',
    menuName: '교통',
    path: '/transport',
  },
]

const systemResearches = ref({
  timeBasic: {
    id: 'timeBasic',
    name: '시간 기초 연구',
    durationSeconds: 180,
    startedAtMs: null,
    completed: false,
  },
  dataBasic: {
    id: 'dataBasic',
    name: '데이터 기초 연구',
    durationSeconds: 180,
    startedAtMs: null,
    completed: false,
  },
})

const recruitment = ref({
  maxCurrentStaff: 4,
  candidateStartedAtMs: null,
  targetStaffNumber: null,
  pendingCandidate: null,
})

const isTimeDisplayUnlocked = computed(() => {
  return systemResearches.value.timeBasic.completed
})

const isDataSaveUnlocked = computed(() => {
  return savingUnlocked.value && systemResearches.value.dataBasic.completed
})

const hasSystemSecretary = computed(() => {
  return Boolean(systemSecretaryStaffId.value)
})

const menuCards = computed(() => {
  return departments.map((department) => {
    return {
      ...department,
      isOpen: menusUnlocked.value && isDepartmentStaffed(department.id),
    }
  })
})

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveStateToIndexedDB() {
  if (!savingUnlocked.value) return

  const db = await openDatabase()

  const payload = {
    company: company.value,
    staffList: staffList.value,
    menusUnlocked: menusUnlocked.value,
    savingUnlocked: savingUnlocked.value,
    systemResearches: systemResearches.value,
    recruitment: recruitment.value,
    systemSecretaryStaffId: systemSecretaryStaffId.value,
  }

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(payload, SAVE_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

  db.close()
}

async function loadStateFromIndexedDB() {
  const db = await openDatabase()

  const savedState = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(SAVE_KEY)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })

  db.close()

  if (!savedState || !savedState.savingUnlocked) return

  company.value = savedState.company ?? null
  staffList.value = savedState.staffList ?? []
  menusUnlocked.value = savedState.menusUnlocked ?? false
  savingUnlocked.value = savedState.savingUnlocked ?? false
  systemSecretaryStaffId.value = savedState.systemSecretaryStaffId ?? ''

  if (savedState.systemResearches) {
    systemResearches.value = {
      ...systemResearches.value,
      ...savedState.systemResearches,
    }
  }

  if (savedState.recruitment) {
    recruitment.value = {
      ...recruitment.value,
      ...savedState.recruitment,
      maxCurrentStaff: 4,
    }
  }

  normalizeRecruitmentState()
}

async function initRctsStore() {
  if (storeLoaded.value) return

  try {
    await loadStateFromIndexedDB()
  } finally {
    storeLoaded.value = true
  }
}

function persistIfSavingUnlocked() {
  if (!savingUnlocked.value) return
  saveStateToIndexedDB()
}

function normalizeRecruitmentState() {
  if (staffList.value.length >= recruitment.value.maxCurrentStaff) {
    recruitment.value.pendingCandidate = null
    recruitment.value.candidateStartedAtMs = null
    recruitment.value.targetStaffNumber = null
    return
  }

  if (
    recruitment.value.pendingCandidate &&
    recruitment.value.pendingCandidate.targetStaffNumber >= 4 &&
    staffList.value.length < 4
  ) {
    recruitment.value.pendingCandidate = null
    recruitment.value.targetStaffNumber = 4
    recruitment.value.candidateStartedAtMs = Date.now()
  }
}

function createCompany(name) {
  company.value = {
    id: 'player-company',
    name: name.trim(),
  }
}

function getDepartmentName(departmentId) {
  return (
    departments.find((department) => department.id === departmentId)
      ?.departmentName ?? ''
  )
}

function getDepartmentHeadTitle(departmentId) {
  const departmentName = getDepartmentName(departmentId)

  if (!departmentName) return ''

  return `${departmentName}장`
}

function createStaff({ name, gender, departmentId }) {
  return {
    id: `staff-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim(),
    gender,
    departmentId,
    departmentName: getDepartmentName(departmentId),
    status: '배치 완료',
    createdAtMs: Date.now(),
  }
}

function registerFirstStaff({ name, gender, departmentId }) {
  const firstStaff = {
    ...createStaff({ name, gender, departmentId }),
    id: 'first-staff',
  }

  staffList.value = [firstStaff]
  menusUnlocked.value = true

  persistIfSavingUnlocked()

  return firstStaff
}

function registerAdditionalStaff({ name, gender, departmentId }) {
  const newStaff = createStaff({ name, gender, departmentId })

  staffList.value = [...staffList.value, newStaff]

  recruitment.value.pendingCandidate = null
  recruitment.value.candidateStartedAtMs = null
  recruitment.value.targetStaffNumber = null

  persistIfSavingUnlocked()

  return newStaff
}

function isDepartmentStaffed(departmentId) {
  return staffList.value.some((staff) => staff.departmentId === departmentId)
}

function isMenuOpen(departmentId) {
  return menusUnlocked.value && isDepartmentStaffed(departmentId)
}

function getDepartmentHead(departmentId) {
  return staffList.value.find((staff) => staff.departmentId === departmentId) ?? null
}

function getStaffRoleTitle(staff) {
  const departmentHead = getDepartmentHead(staff.departmentId)

  if (departmentHead?.id === staff.id) {
    return getDepartmentHeadTitle(staff.departmentId)
  }

  if (systemSecretaryStaffId.value === staff.id) {
    return '시스템부 비서'
  }

  return '직원'
}

function getSystemDepartmentStaff() {
  return staffList.value.filter((staff) => staff.departmentId === 'system')
}

function getSystemSecretaryCandidates() {
  const systemHead = getDepartmentHead('system')

  return getSystemDepartmentStaff().filter((staff) => {
    return staff.id !== systemHead?.id
  })
}

function assignSystemSecretary(staffId) {
  const targetStaff = staffList.value.find((staff) => staff.id === staffId)
  const systemHead = getDepartmentHead('system')

  if (!targetStaff) return
  if (targetStaff.departmentId !== 'system') return
  if (targetStaff.id === systemHead?.id) return

  systemSecretaryStaffId.value = staffId
  persistIfSavingUnlocked()
}

function getSystemSecretary() {
  return staffList.value.find((staff) => staff.id === systemSecretaryStaffId.value) ?? null
}

function getResearch(researchId) {
  return systemResearches.value[researchId] ?? null
}

function canStartResearch(researchId) {
  const research = getResearch(researchId)

  if (!research || research.completed || research.startedAtMs) {
    return false
  }

  if (researchId === 'dataBasic') {
    return systemResearches.value.timeBasic.completed
  }

  return true
}

function startSystemResearch(researchId) {
  if (!canStartResearch(researchId)) return

  systemResearches.value[researchId].startedAtMs = Date.now()
  persistIfSavingUnlocked()
}

function getResearchRemainingSeconds(researchId, nowMs) {
  const research = getResearch(researchId)

  if (!research || !research.startedAtMs || research.completed) {
    return 0
  }

  const elapsedSeconds = Math.floor((nowMs - research.startedAtMs) / 1000)
  return Math.max(0, research.durationSeconds - elapsedSeconds)
}

function isResearchFinished(researchId, nowMs) {
  const research = getResearch(researchId)

  if (!research || !research.startedAtMs || research.completed) {
    return false
  }

  return getResearchRemainingSeconds(researchId, nowMs) <= 0
}

function completeSystemResearch(researchId) {
  const research = getResearch(researchId)

  if (!research || research.completed) return

  systemResearches.value[researchId].completed = true

  if (researchId === 'dataBasic') {
    savingUnlocked.value = true
  }

  persistIfSavingUnlocked()
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const restSeconds = safeSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

function getRandomGender() {
  return Math.random() < 0.5 ? '남성' : '여성'
}

function getRecruitmentDelaySeconds(targetStaffNumber) {
  if (targetStaffNumber <= 3) return 60
  return 3600
}

function canOpenRecruitment() {
  normalizeRecruitmentState()

  if (staffList.value.length >= recruitment.value.maxCurrentStaff) return false
  if (recruitment.value.pendingCandidate) return false
  if (recruitment.value.candidateStartedAtMs) return false

  return true
}

function openRecruitment(nowMs = Date.now()) {
  if (!canOpenRecruitment()) return

  recruitment.value.targetStaffNumber = staffList.value.length + 1
  recruitment.value.candidateStartedAtMs = nowMs

  persistIfSavingUnlocked()
}

function updateRecruitment(nowMs) {
  normalizeRecruitmentState()

  if (recruitment.value.pendingCandidate) return
  if (!recruitment.value.candidateStartedAtMs) return
  if (!recruitment.value.targetStaffNumber) return

  const delaySeconds = getRecruitmentDelaySeconds(recruitment.value.targetStaffNumber)
  const elapsedSeconds = Math.floor((nowMs - recruitment.value.candidateStartedAtMs) / 1000)

  if (elapsedSeconds < delaySeconds) return

  recruitment.value.pendingCandidate = {
    id: `candidate-${recruitment.value.targetStaffNumber}`,
    gender: getRandomGender(),
    targetStaffNumber: recruitment.value.targetStaffNumber,
  }

  recruitment.value.candidateStartedAtMs = null
  recruitment.value.targetStaffNumber = null

  persistIfSavingUnlocked()
}

function getRecruitmentRemainingSeconds(nowMs) {
  if (recruitment.value.pendingCandidate) return 0
  if (!recruitment.value.candidateStartedAtMs || !recruitment.value.targetStaffNumber) return 0

  const delaySeconds = getRecruitmentDelaySeconds(recruitment.value.targetStaffNumber)
  const elapsedSeconds = Math.floor((nowMs - recruitment.value.candidateStartedAtMs) / 1000)

  return Math.max(0, delaySeconds - elapsedSeconds)
}

function isCurrentRecruitmentLimitReached() {
  return staffList.value.length >= recruitment.value.maxCurrentStaff
}

export function useRctsStore() {
  return {
    company,
    staffList,
    menusUnlocked,
    savingUnlocked,
    storeLoaded,
    departments,
    systemResearches,
    recruitment,
    systemSecretaryStaffId,
    menuCards,
    isTimeDisplayUnlocked,
    isDataSaveUnlocked,
    hasSystemSecretary,
    initRctsStore,
    createCompany,
    registerFirstStaff,
    registerAdditionalStaff,
    isMenuOpen,
    isDepartmentStaffed,
    getDepartmentHead,
    getDepartmentHeadTitle,
    getStaffRoleTitle,
    getSystemDepartmentStaff,
    getSystemSecretaryCandidates,
    assignSystemSecretary,
    getSystemSecretary,
    getResearch,
    canStartResearch,
    startSystemResearch,
    getResearchRemainingSeconds,
    isResearchFinished,
    completeSystemResearch,
    formatSeconds,
    canOpenRecruitment,
    openRecruitment,
    updateRecruitment,
    getRecruitmentRemainingSeconds,
    isCurrentRecruitmentLimitReached,
  }
}