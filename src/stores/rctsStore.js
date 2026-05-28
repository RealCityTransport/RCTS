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
const lastSavedAtMs = ref(null)

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
    startedAtTick: null,
    completed: false,
  },
  dataBasic: {
    id: 'dataBasic',
    name: '데이터 기초 연구',
    durationSeconds: 180,
    startedAtTick: null,
    completed: false,
  },
})

const recruitment = ref({
  maxCurrentStaff: 4,
  candidateStartedAtTick: null,
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

async function writeStateToIndexedDB() {
  const db = await openDatabase()

  const savedAtMs = Date.now()

  const payload = {
    company: company.value,
    staffList: staffList.value,
    menusUnlocked: menusUnlocked.value,
    savingUnlocked: savingUnlocked.value,
    systemResearches: systemResearches.value,
    recruitment: recruitment.value,
    systemSecretaryStaffId: systemSecretaryStaffId.value,
    lastSavedAtMs: savedAtMs,
  }

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(payload, SAVE_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

  db.close()

  lastSavedAtMs.value = savedAtMs
}

async function saveGame() {
  if (!isDataSaveUnlocked.value) return false

  await writeStateToIndexedDB()
  return true
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

  if (!savedState) return

  company.value = savedState.company ?? null
  staffList.value = savedState.staffList ?? []
  menusUnlocked.value = savedState.menusUnlocked ?? false
  savingUnlocked.value = savedState.savingUnlocked ?? false
  systemSecretaryStaffId.value = savedState.systemSecretaryStaffId ?? ''
  lastSavedAtMs.value = savedState.lastSavedAtMs ?? null

  if (savedState.systemResearches) {
    systemResearches.value = {
      timeBasic: {
        ...systemResearches.value.timeBasic,
        ...savedState.systemResearches.timeBasic,
        startedAtTick:
          savedState.systemResearches.timeBasic?.startedAtTick ?? null,
      },
      dataBasic: {
        ...systemResearches.value.dataBasic,
        ...savedState.systemResearches.dataBasic,
        startedAtTick:
          savedState.systemResearches.dataBasic?.startedAtTick ?? null,
      },
    }
  }

  if (savedState.recruitment) {
    recruitment.value = {
      ...recruitment.value,
      ...savedState.recruitment,
      maxCurrentStaff: 4,
      candidateStartedAtTick:
        savedState.recruitment.candidateStartedAtTick ?? null,
    }
  }

  normalizeRecruitmentState(0)
}

async function initRctsStore() {
  if (storeLoaded.value) return

  try {
    await loadStateFromIndexedDB()
  } finally {
    storeLoaded.value = true
  }
}

function normalizeRecruitmentState(currentTick) {
  if (staffList.value.length >= recruitment.value.maxCurrentStaff) {
    recruitment.value.pendingCandidate = null
    recruitment.value.candidateStartedAtTick = null
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
    recruitment.value.candidateStartedAtTick = currentTick
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

  return firstStaff
}

function registerAdditionalStaff({ name, gender, departmentId }) {
  const newStaff = createStaff({ name, gender, departmentId })

  staffList.value = [...staffList.value, newStaff]

  recruitment.value.pendingCandidate = null
  recruitment.value.candidateStartedAtTick = null
  recruitment.value.targetStaffNumber = null

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
}

function getSystemSecretary() {
  return staffList.value.find((staff) => staff.id === systemSecretaryStaffId.value) ?? null
}

function getResearch(researchId) {
  return systemResearches.value[researchId] ?? null
}

function canStartResearch(researchId) {
  const research = getResearch(researchId)

  if (!research || research.completed || research.startedAtTick !== null) {
    return false
  }

  if (researchId === 'dataBasic') {
    return systemResearches.value.timeBasic.completed
  }

  return true
}

function startSystemResearch(researchId, currentTick) {
  if (!canStartResearch(researchId)) return

  systemResearches.value[researchId].startedAtTick = currentTick
}

function getResearchRemainingSeconds(researchId, currentTick) {
  const research = getResearch(researchId)

  if (!research || research.startedAtTick === null || research.completed) {
    return 0
  }

  const elapsedSeconds = currentTick - research.startedAtTick
  return Math.max(0, research.durationSeconds - elapsedSeconds)
}

function isResearchFinished(researchId, currentTick) {
  const research = getResearch(researchId)

  if (!research || research.startedAtTick === null || research.completed) {
    return false
  }

  return getResearchRemainingSeconds(researchId, currentTick) <= 0
}

function completeSystemResearch(researchId) {
  const research = getResearch(researchId)

  if (!research || research.completed) return

  systemResearches.value[researchId].completed = true

  if (researchId === 'dataBasic') {
    savingUnlocked.value = true
  }
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

function canOpenRecruitment(currentTick = 0) {
  normalizeRecruitmentState(currentTick)

  if (staffList.value.length >= recruitment.value.maxCurrentStaff) return false
  if (recruitment.value.pendingCandidate) return false
  if (recruitment.value.candidateStartedAtTick !== null) return false

  return true
}

function openRecruitment(currentTick) {
  if (!canOpenRecruitment(currentTick)) return

  recruitment.value.targetStaffNumber = staffList.value.length + 1
  recruitment.value.candidateStartedAtTick = currentTick
}

function updateRecruitment(currentTick) {
  normalizeRecruitmentState(currentTick)

  if (recruitment.value.pendingCandidate) return
  if (recruitment.value.candidateStartedAtTick === null) return
  if (!recruitment.value.targetStaffNumber) return

  const delaySeconds = getRecruitmentDelaySeconds(recruitment.value.targetStaffNumber)
  const elapsedSeconds = currentTick - recruitment.value.candidateStartedAtTick

  if (elapsedSeconds < delaySeconds) return

  recruitment.value.pendingCandidate = {
    id: `candidate-${recruitment.value.targetStaffNumber}`,
    gender: getRandomGender(),
    targetStaffNumber: recruitment.value.targetStaffNumber,
  }

  recruitment.value.candidateStartedAtTick = null
  recruitment.value.targetStaffNumber = null
}

function getRecruitmentRemainingSeconds(currentTick) {
  if (recruitment.value.pendingCandidate) return 0
  if (recruitment.value.candidateStartedAtTick === null) return 0
  if (!recruitment.value.targetStaffNumber) return 0

  const delaySeconds = getRecruitmentDelaySeconds(recruitment.value.targetStaffNumber)
  const elapsedSeconds = currentTick - recruitment.value.candidateStartedAtTick

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
    lastSavedAtMs,
    menuCards,
    isTimeDisplayUnlocked,
    isDataSaveUnlocked,
    hasSystemSecretary,
    initRctsStore,
    saveGame,
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