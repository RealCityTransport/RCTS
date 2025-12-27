// src/features/idle/pages/useIdletestView.ts
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameTime } from '@/composables/useGameTime'
import { formatKstTimeYYYYMMDDHHMM } from '@/utils/timeFormat'

import {
  VILLAGE_BUS_BASE_CONFIG,
  BUS_DWELL_SEC,
  BUS_TRAVEL_SEC,
  BUS_CYCLE_SEC,
  BUS_RECONFIG_SEC,
  VILLAGE_BUS_RESEARCH_CATALOG,
  createInitialVillageBusState,
} from '@/features/idle/transports/bus/busData'
import {
  simulateVillageBusStops,
  applyVillageBusResearchToState,
  getBusRunDuration,
  getBusPhaseInfo,
  mapSegmentToLineStop,
  buildBusRunScript,
} from '@/features/idle/transports/bus/busEngine'

import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import { db } from '@/libs/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

/**
 * 이 브라우저 탭을 식별하는 임시 clientId
 * (새로고침/다른 탭은 다른 값)
 */
function createClientId() {
  return (
    'idle_' +
    Math.random().toString(36).slice(2) +
    '_' +
    Date.now().toString(36)
  )
}

const CLIENT_ID = createClientId()

// 버스 1루프 스크립트 타입
type BusRunStep = {
  loopStopIndex: number
  physicalStopIndex: number
  board: number
  deboard: number
  income: number
  passengersAfter: number
}

type BusRunScript = {
  totalDurationSec: number
  totalStops: number
  steps: BusRunStep[]
}

// 슬롯 운행 메타 타입 (ownerClientId + script 추가)
type SlotRunMeta = {
  startedAtMs: number
  durationSec: number
  stopsProcessed?: number
  ownerClientId?: string
  script?: BusRunScript
}

// 연구 상태 타입 (필수 boolean)
type VillageBusResearchState = {
  capacityUpgradeDone: boolean
  lineExtensionDone: boolean
  peakRushDone: boolean
}

// 버스 런타임 상태 타입 (슬롯별로 1개씩 사용)
type BusRuntimeState = ReturnType<typeof createInitialVillageBusState>

// 자동 저장/리더 관리
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000 // 10분 자동 저장 간격
const LEADER_EXPIRE_MS = 5 * 1000 // 5초 리더 타임아웃
const LEADER_HEARTBEAT_MS = 2 * 1000 // 2초마다 리더 하트비트

// 로컬 개발 환경 여부
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export function useIdletestView() {
  // ─────────────────────────────────────────────
  // 내부 시계 (실제 시간 기준, 0.2초마다 업데이트 → 진행/정류장 위치 계산용)
  // ─────────────────────────────────────────────
  const logicNowMs = ref(Date.now())
  let logicTimer: ReturnType<typeof setInterval> | null = null

  if (typeof window !== 'undefined') {
    logicTimer = setInterval(() => {
      logicNowMs.value = Date.now()
    }, 200) // 0.2초마다 갱신
  }

  // ─────────────────────────────────────────────
  // 기본 상수
  // ─────────────────────────────────────────────
  const DEFAULT_RUN_DURATION_SEC = 60
  const SLOT_UNLOCK_DURATION_SEC = 30

  const transportRouteNames: Record<string, string> = {
    bus: '마을버스 순환 노선',
    truck: '물류 허브 왕복 노선',
    rail: '광역 급행 열차',
    air: '국제선 허브 왕복 노선',
    ship: '대륙간 화물 항로',
    space: '궤도 정거장 셔틀',
  }

  const transportConfigs = [
    {
      key: 'bus',
      label: '버스',
      isStarter: true,
      unlockStage: 1,
      baseUnlockCost: 20000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 1500,
      researchDescription:
        '마을버스: 기본요금 1,500원, 정원 25명(연구 시 40명), 기본 물리 10개 정류장(왕복 19회 정차) 운행. 연구로 물리 20개 정류장(왕복 39회 정차)까지 연장됩니다. 정류장마다 30초 정차 후 약 1분 30초 동안 다음 정류장으로 이동하며, 승차 인원 기준으로 수익을 정산합니다.',
    },
    {
      key: 'truck',
      label: '트럭',
      isStarter: true,
      unlockStage: 1,
      baseUnlockCost: 20000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 1500,
      researchDescription:
        '트럭 적재량, 배송 속도, 물류 허브 효율을 올려 시간당 화물 처리량과 수익을 늘리는 연구입니다. (현재 비활성화)',
    },
    {
      key: 'rail',
      label: '철도',
      isStarter: true,
      unlockStage: 1,
      baseUnlockCost: 20000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 2000,
      researchDescription:
        '철도 수송량, 열차 편성, 신호 시스템을 개선해 고정 노선의 안정적인 수익원을 만드는 연구입니다. (현재 비활성화)',
    },
    {
      key: 'air',
      label: '비행기',
      isStarter: false,
      unlockStage: 2,
      baseUnlockCost: 80000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 3200,
      researchDescription:
        '공항 슬롯, 항로 효율, 탑승률 최적화를 통해 장거리 고수익 노선을 구축하는 연구입니다. (현재 비활성화)',
    },
    {
      key: 'ship',
      label: '배',
      isStarter: false,
      unlockStage: 2,
      baseUnlockCost: 80000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 2600,
      researchDescription:
        '항구 처리량, 선박 적재량, 항로 운영비를 개선해 대량 화물과 승객 운송에 특화된 연구입니다. (현재 비활성화)',
    },
    {
      key: 'space',
      label: '우주선',
      isStarter: false,
      unlockStage: 3,
      baseUnlockCost: 250000,
      maxSlots: 10,
      baseSlots: 10,
      baseIncomePerSlot: 5000,
      researchDescription:
        '우주항, 궤도 노선, 연료 기술을 연구해 극단적인 고위험·고수익 노선을 개척하는 연구입니다. (현재 비활성화)',
    },
  ] as const

  const transportConfigMap = transportConfigs.reduce(
    (map, cfg) => {
      map[cfg.key] = cfg
      return map
    },
    {} as Record<string, (typeof transportConfigs)[number]>,
  )

  const transportTypes = transportConfigs.map((t) => t.key as string)
  const starterTransports = transportConfigs
    .filter((t) => t.isStarter)
    .map((t) => t.key as string)

  // ─────────────────────────────────────────────
  // 게임 시간 (표시용 표준시간)
  // ─────────────────────────────────────────────
  const { gameTime } = useGameTime({
    initialSpeed: 1,
  })

  const formattedGameTime = computed(() =>
    formatKstTimeYYYYMMDDHHMM(gameTime.value),
  )

  const activeMenu = ref<'bus' | string>('bus')

  // ─────────────────────────────────────────────
  // 자금
  // ─────────────────────────────────────────────
  const idleFunds = ref(0)

  const formattedIdleFunds = computed(() =>
    idleFunds.value.toLocaleString('ko-KR'),
  )

  // ─────────────────────────────────────────────
  // Firebase Auth (Google 로그인)
  // ─────────────────────────────────────────────
  const { user, isLoggedIn, signInWithGoogle, logout } = useFirebaseAuth()

  function handleLogin() {
    signInWithGoogle()
  }

  function handleLogout() {
    logout()
  }

  // ─────────────────────────────────────────────
  // 리더 디바이스 관리
  // ─────────────────────────────────────────────
  const isLeader = ref(false)
  let lastAutoSaveMs = 0
  let beforeUnloadHandler: (() => void) | null = null

  // 원격 리더 상태 스냅샷
  const remoteLeaderClientId = ref<string | null>(null)
  const remoteLeaderLastSeenAt = ref<number | null>(null)
  let lastLeaderHeartbeatMs = 0

  // ─────────────────────────────────────────────
  // 마을버스 라인 상태 (기본 템플릿/연구용)
  // ─────────────────────────────────────────────
  const villageBusState = ref(createInitialVillageBusState())

  // 슬롯별 버스 런타임 상태 (승차/하차/탑승자/총수익 등)
  const busRuntimeStates = ref<Record<string, BusRuntimeState>>({})

  // 연구 진행 메타 (키별 연구 타이머)
  const busResearchProgress = ref<
    Record<string, { startedAtMs: number; durationSec: number }>
  >({})

  function ensureBusRuntimeState(slotKey: string): BusRuntimeState {
    const existing = busRuntimeStates.value[slotKey]
    if (existing) return existing

    const line = villageBusState.value
    const base = createInitialVillageBusState()

    // 슬롯별 상태는 “구성 값”만 라인에서 가져오고
    // 동적인 수치(currentPassengers, lastBoard, lastDeboard 등)는 항상 0부터 시작
    base.capacity = line.capacity
    base.stopsPerLoop = line.stopsPerLoop
    base.currentPassengers = 0
    base.totalIncome = 0
    ;(base as any).lastStopIndex = 0
    ;(base as any).lastLoopStopIndex = 0
    ;(base as any).lastPhysicalStopIndex = 0
    ;(base as any).lastBoard = 0
    ;(base as any).lastDeboard = 0

    base.research = {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
      ...(line.research || {}),
    }

    busRuntimeStates.value = {
      ...busRuntimeStates.value,
      [slotKey]: base,
    }

    return base
  }

  // ─────────────────────────────────────────────
  // 운송수단/해금 관련
  // ─────────────────────────────────────────────
  const currentTransportConfig = computed(() => {
    return transportConfigMap[activeMenu.value] || null
  })

  const currentTransportLabel = computed(() =>
    currentTransportConfig.value ? currentTransportConfig.value.label : '',
  )

  const currentSlotCount = computed(() =>
    currentTransportConfig.value ? currentTransportConfig.value.maxSlots : 10,
  )

  const isCurrentStarterTransport = computed(
    () =>
      !!currentTransportConfig.value &&
      currentTransportConfig.value.isStarter,
  )

  const currentUnlockStage = computed(() =>
    currentTransportConfig.value
      ? currentTransportConfig.value.unlockStage
      : 1,
  )

  const unlockedTransports = ref<string[]>([])

  const hasAnyStarterUnlocked = computed(() =>
    unlockedTransports.value.some((t: string) =>
      starterTransports.includes(t),
    ),
  )

  const isCurrentStarterFree = computed(
    () => isCurrentStarterTransport.value && !hasAnyStarterUnlocked.value,
  )

  const currentTransportUnlockCost = computed(() => {
    const cfg = currentTransportConfig.value
    if (!cfg) return 0
    if (cfg.isStarter && !hasAnyStarterUnlocked.value) return 0
    return cfg.baseUnlockCost
  })

  const isCurrentTransportUnlocked = computed(() =>
    unlockedTransports.value.includes(activeMenu.value),
  )

  const currentResearchDescription = computed(() => {
    return currentTransportConfig.value
      ? currentTransportConfig.value.researchDescription
      : '해당 운송수단의 효율과 수익을 서서히 올리는 연구입니다.'
  })

  function slotKey(type: string, id: number) {
    return `${type}-${id}`
  }

  /**
   * 공통 남은 시간 포맷터
   * - 1시간 이상: HH:MM:SS
   * - 1분 이상 ~ 1시간 미만: MM:SS
   * - 1분 미만: SS
   */
  function formatCompactDuration(sec: number) {
    const total = Math.max(0, Math.floor(sec))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60

    if (h > 0) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const ss = String(s).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }

    if (m > 0) {
      const mm = String(m).padStart(2, '0')
      const ss = String(s).padStart(2, '0')
      return `${mm}:${ss}`
    }

    // 1분 미만 → SS
    const ss = String(s).padStart(2, '0')
    return ss
  }

  function formatRemainingText(remainingSec: number, isRunning: boolean) {
    if (!isRunning) return '대기 중'
    const core = formatCompactDuration(remainingSec)
    return `${core} 남음`
  }

  function formatUnlockRemainingText(remainingSec: number) {
    const s = Math.max(0, Math.floor(remainingSec))
    const m = Math.floor(s / 60)
    const r = s % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(r).padStart(2, '0')
    return `${mm}:${ss} 후 활성화`
  }

  function formatResearchTime(sec: number) {
    const minutes = Math.max(1, Math.round(sec / 60))
    return `${minutes}분`
  }

  // 이동/정차 남은 시간용 – 접두/접미 없이 순수 시간 문자열만
  function formatPhaseRemaining(sec: number) {
    return formatCompactDuration(sec)
  }

  function getRunDurationSec(type: string) {
    if (type === 'bus') {
      return getBusRunDuration(villageBusState.value)
    }

    const cfg = transportConfigMap[type]
    return (cfg as any)?.baseRunDurationSec || DEFAULT_RUN_DURATION_SEC
  }

  function getSlotActivationCost(type: string) {
    const cfg = transportConfigMap[type]
    const base = cfg?.baseIncomePerSlot || 1000
    return base * 200
  }

  function getAutoRunCost(type: string) {
    const cfg = transportConfigMap[type]
    const base = cfg?.baseIncomePerSlot || 1000
    return base * 500
  }

  function getTransportUnlockCost(type: string) {
    const cfg = transportConfigMap[type]
    if (!cfg) return 0
    if (cfg.isStarter && !hasAnyStarterUnlocked.value) return 0
    return cfg.baseUnlockCost
  }

  const canAffordSlotActivation = computed(() => {
    const type = activeMenu.value
    const cost = getSlotActivationCost(type)
    return idleFunds.value >= cost
  })

  const canAffordAutoRun = computed(() => {
    const type = activeMenu.value
    const cost = getAutoRunCost(type)
    return idleFunds.value >= cost
  })

  const canAffordTransportUnlock = computed(() => {
    const type = activeMenu.value
    const cfg = transportConfigMap[type]
    if (cfg?.isStarter && !hasAnyStarterUnlocked.value) return true
    const cost = getTransportUnlockCost(type)
    return idleFunds.value >= cost
  })

  // 전체 라인 기준 요약 정보 (슬롯별이 아니라 “라인” 요약)
  const busLastStopInfo = computed(() => {
    const state = villageBusState.value
    const stopsPerLoop =
      state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
    const baseCapacity =
      state.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity

    const totalStops = stopsPerLoop
    const uniqueStops = Math.max(
      1,
      Math.floor((totalStops + 1) / 2),
    )

    const loopIndexRaw =
      (state as any).lastLoopStopIndex ||
      (state as any).lastStopIndex ||
      0

    let physicalIndexRaw =
      (state as any).lastPhysicalStopIndex || 0

    if (!physicalIndexRaw && loopIndexRaw > 0 && uniqueStops >= 1) {
      physicalIndexRaw = mapSegmentToLineStop(loopIndexRaw, uniqueStops)
    }

    return {
      loopIndex: loopIndexRaw,
      physicalIndex: physicalIndexRaw,
      board: state.lastBoard || 0,
      deboard: state.lastDeboard || 0,
      passengers: state.currentPassengers || 0,
      stopsPerLoop,
      capacity: baseCapacity,
    }
  })

  // 물리 정류장 수 (왕복 기준: 10개 정류장 → 19정차, 20개 정류장 → 39정차)
  const busUniqueStops = computed(() => {
    const totalStops = busLastStopInfo.value.stopsPerLoop
    if (totalStops <= 0) return 1
    return Math.max(
      1,
      Math.floor((totalStops + 1) / 2),
    )
  })

  const busResearchList = computed(() => {
    const baseResearch: VillageBusResearchState = {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
      ...(villageBusState.value.research || {}),
    }
    const r: VillageBusResearchState = baseResearch

    const coreItems = [
      VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade,
      VILLAGE_BUS_RESEARCH_CATALOG.lineExtension,
      VILLAGE_BUS_RESEARCH_CATALOG.peakRush,
    ]

    const nowMs = logicNowMs.value
    const progressMap = busResearchProgress.value

    const researchItems = coreItems.map((cfg) => {
      let done = false
      if (cfg.key === 'capacityUpgrade') done = !!r.capacityUpgradeDone
      if (cfg.key === 'lineExtension') done = !!r.lineExtensionDone
      if (cfg.key === 'peakRush') done = !!r.peakRushDone

      let inProgress = false
      let remainingLabel = ''

      const progress = progressMap[cfg.key]
      if (!done && progress) {
        const elapsedSec = Math.max(
          0,
          (nowMs - progress.startedAtMs) / 1000,
        )
        const durationSec = progress.durationSec || cfg.timeSec || 0
        if (durationSec > 0 && elapsedSec < durationSec) {
          inProgress = true
          const remainSec = Math.max(0, durationSec - elapsedSec)
          remainingLabel = `${formatCompactDuration(remainSec)}`
        }
      }

      return {
        ...cfg,
        done,
        timeLabel: formatResearchTime(cfg.timeSec),
        inProgress,
        remainingLabel,
      }
    })

    const placeholderItems = [
      {
        key: 'cityBus',
        id: 'village_bus_city',
        name: '시내버스',
        desc: '시내버스 노선 관련 연구는 곧 추가됩니다.',
        type: 'variant',
        effect: {},
        cost: 0,
        timeSec: 0,
        done: false,
        timeLabel: '준비 중',
        inProgress: false,
        remainingLabel: '',
      },
      {
        key: 'metroBus',
        id: 'village_bus_metro',
        name: '광역버스',
        desc: '광역버스 노선 관련 연구는 곧 추가됩니다.',
        type: 'variant',
        effect: {},
        cost: 0,
        timeSec: 0,
        done: false,
        timeLabel: '준비 중',
        inProgress: false,
        remainingLabel: '',
      },
      {
        key: 'intercityBus',
        id: 'village_bus_intercity',
        name: '시외버스',
        desc: '시외버스 노선 관련 연구는 곧 추가됩니다.',
        type: 'variant',
        effect: {},
        cost: 0,
        timeSec: 0,
        done: false,
        timeLabel: '준비 중',
        inProgress: false,
        remainingLabel: '',
      },
      {
        key: 'expressBus',
        id: 'village_bus_express',
        name: '고속버스',
        desc: '고속버스 노선 관련 연구는 곧 추가됩니다.',
        type: 'variant',
        effect: {},
        cost: 0,
        timeSec: 0,
        done: false,
        timeLabel: '준비 중',
        inProgress: false,
        remainingLabel: '',
      },
      {
        key: 'tourBus',
        id: 'village_bus_tour',
        name: '관광버스',
        desc: '관광버스 노선 관련 연구는 곧 추가됩니다.',
        type: 'variant',
        effect: {},
        cost: 0,
        timeSec: 0,
        done: false,
        timeLabel: '준비 중',
        inProgress: false,
        remainingLabel: '',
      },
    ]

    return [...researchItems, ...placeholderItems]
  })

  const busHasUnappliedUpgrade = computed(() => {
    const state = villageBusState.value
    const base = VILLAGE_BUS_BASE_CONFIG

    const r: VillageBusResearchState = {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
      ...(state.research || {}),
    }

    const targetCapacity = r.capacityUpgradeDone
      ? VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade.effect.capacity
      : base.baseCapacity

    const targetStops = r.lineExtensionDone
      ? VILLAGE_BUS_RESEARCH_CATALOG.lineExtension.effect.baseStopsPerLoop
      : base.baseStopsPerLoop

    return (
      targetCapacity !== state.capacity ||
      targetStops !== state.stopsPerLoop
    )
  })

  const slotAutomation = ref<Record<string, boolean>>({})
  const slotRunMeta = ref<Record<string, SlotRunMeta>>({})
  const slotUnlockMeta = ref<
    Record<string, { startedAtMs: number; durationSec: number }>
  >({})
  const slotActiveFlag = ref<Record<string, boolean>>({})

  const busReconfigMeta = ref<{
    startedAtMs: number
    durationSec: number
  } | null>(null)

  // ─────────────────────────────────────────────
  // Firestore 동기화 (idleStates/{uid})
  // ─────────────────────────────────────────────
  let idleUnsubscribe: (() => void) | null = null
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let lastSaveRequestMs = 0

  function getIdleDocRef(uid: string) {
    return doc(db, 'idleStates', uid)
  }

  function applyRemoteState(data: any) {
    if (!data || typeof data !== 'object') return

    if (typeof data.idleFunds === 'number') {
      idleFunds.value = data.idleFunds
    }

    if (Array.isArray(data.unlockedTransports)) {
      unlockedTransports.value = [...data.unlockedTransports]
    }

    if (data.villageBusState) {
      villageBusState.value = {
        ...villageBusState.value,
        ...data.villageBusState,
      }
    }

    if (data.slotAutomation && typeof data.slotAutomation === 'object') {
      slotAutomation.value = { ...data.slotAutomation }
    }

    if (data.slotRunMeta && typeof data.slotRunMeta === 'object') {
      // script 포함 전체 메타 그대로 반영
      slotRunMeta.value = { ...data.slotRunMeta }
    }

    if (data.slotUnlockMeta && typeof data.slotUnlockMeta === 'object') {
      slotUnlockMeta.value = { ...data.slotUnlockMeta }
    }

    if (data.slotActiveFlag && typeof data.slotActiveFlag === 'object') {
      slotActiveFlag.value = { ...data.slotActiveFlag }
    }

    if (
      data.busResearchProgress &&
      typeof data.busResearchProgress === 'object'
    ) {
      busResearchProgress.value = { ...data.busResearchProgress }
    }

    // 슬롯별 버스 런타임 상태는 여전히 메모리 기준 (필요하면 추가 가능)
  }

  function buildSavePayload() {
    const now = Date.now()
    return {
      idleFunds: idleFunds.value,
      unlockedTransports: unlockedTransports.value,
      villageBusState: villageBusState.value,
      slotAutomation: slotAutomation.value,
      slotRunMeta: slotRunMeta.value, // script 포함
      slotUnlockMeta: slotUnlockMeta.value,
      slotActiveFlag: slotActiveFlag.value,
      busResearchProgress: busResearchProgress.value,
      // 리더 메타
      leaderClientId: isLeader.value ? CLIENT_ID : null,
      leaderLastSeenAt: isLeader.value ? now : null,
      lastSavedAt: now,
    }
  }

  function scheduleSaveIdleState() {
    const uidAtSchedule = user.value?.uid
    if (!uidAtSchedule) return
    if (!isLeader.value) return

    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(async () => {
      saveTimeout = null

      if (!user.value || user.value.uid !== uidAtSchedule) {
        console.log('[idle] skip save: user changed or logged out', {
          uidAtSchedule,
          currentUid: user.value?.uid || null,
        })
        return
      }

      try {
        const refDoc = getIdleDocRef(uidAtSchedule)
        const payload = buildSavePayload()
        await setDoc(refDoc, payload, { merge: true })
        console.log('[idle] saveIdleState success', uidAtSchedule)
      } catch (err) {
        console.error('idle state save failed:', err)
      }
    }, 800)
  }

  function requestSave(force = false) {
    const now = Date.now()

    if (!force) {
      if (now - lastSaveRequestMs < 5000) {
        return
      }
    }

    lastSaveRequestMs = now
    scheduleSaveIdleState()
  }

  function attachBeforeUnload(uid: string) {
    if (typeof window === 'undefined') return
    if (beforeUnloadHandler) return

    beforeUnloadHandler = () => {
      if (!isLeader.value) return
      const refDoc = getIdleDocRef(uid)
      const payload = buildSavePayload()
      payload.leaderClientId = null
      setDoc(refDoc, payload, { merge: true }).catch(() => {
        // best-effort
      })
    }

    window.addEventListener('beforeunload', beforeUnloadHandler)
  }

  function detachBeforeUnload() {
    if (typeof window === 'undefined') return
    if (!beforeUnloadHandler) return
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    beforeUnloadHandler = null
  }

  watch(
    () => user.value?.uid || null,
    (uid, oldUid) => {
      if (idleUnsubscribe) {
        idleUnsubscribe()
        idleUnsubscribe = null
      }

      if (!uid) {
        console.log('[idle] user logged out, unsubscribe idleStates', oldUid)
        detachBeforeUnload()

        // 로그아웃 상태: 이 기기를 항상 리더로 취급 (저장은 uid 없어서 실행 안 됨)
        isLeader.value = true

        remoteLeaderClientId.value = null
        remoteLeaderLastSeenAt.value = null

        return
      }

      console.log('[idle] subscribe idleStates', uid)
      const refDoc = getIdleDocRef(uid)
      idleUnsubscribe = onSnapshot(
        refDoc,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            console.log('[idle] snapshot exists', uid)
            applyRemoteState(data)

            const leaderId = data.leaderClientId as string | undefined
            const leaderLastSeenAt = data.leaderLastSeenAt as number | undefined
            const nowWall = Date.now()

            remoteLeaderClientId.value = leaderId ?? null
            remoteLeaderLastSeenAt.value =
              typeof leaderLastSeenAt === 'number' ? leaderLastSeenAt : null

            if (IS_LOCALHOST) {
              if (!isLeader.value || leaderId !== CLIENT_ID) {
                console.log('[idle] localhost: force leader takeover')
                isLeader.value = true
                attachBeforeUnload(uid)
                requestSave(true)
              }
              return
            }

            let shouldTakeLeadership = false

            if (!leaderId) {
              shouldTakeLeadership = true
            } else if (!leaderLastSeenAt) {
              shouldTakeLeadership = true
            } else if (nowWall - leaderLastSeenAt > LEADER_EXPIRE_MS) {
              shouldTakeLeadership = true
            }

            if (shouldTakeLeadership) {
              console.log('[idle] leader expired or empty, take leadership', {
                leaderId,
                leaderLastSeenAt,
                nowWall,
              })
              isLeader.value = true
              attachBeforeUnload(uid)
              requestSave(true)
            } else {
              isLeader.value = leaderId === CLIENT_ID
              if (isLeader.value) {
                attachBeforeUnload(uid)
              } else {
                detachBeforeUnload()
              }
            }
          } else {
            console.log('[idle] snapshot not exists (new doc)', uid)
            remoteLeaderClientId.value = null
            remoteLeaderLastSeenAt.value = null

            isLeader.value = true
            attachBeforeUnload(uid)
            requestSave(true)
          }
        },
        (err) => {
          console.error('idle state subscribe failed:', err)
        },
      )
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (idleUnsubscribe) idleUnsubscribe()
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
    }
    if (logicTimer !== null) {
      clearInterval(logicTimer)
      logicTimer = null
    }
    detachBeforeUnload()
  })

  // ─────────────────────────────────────────────
  // 슬롯 빌드 (UI용) — 0.2초마다 정류장/방향/남은 시간 재계산
  // ─────────────────────────────────────────────
  const transportSlots = computed(() => {
    const nowMs = logicNowMs.value

    const result: Record<string, Array<ReturnType<typeof buildSlot>>> = {}

    const busLineState = villageBusState.value
    const busStopsPerLoop =
      busLineState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
    const busUnique = Math.max(
      1,
      Math.floor((busStopsPerLoop + 1) / 2),
    )

    function buildSlot(type: string, index: number) {
      const id = index + 1
      const key = slotKey(type, id)
      const runMeta = slotRunMeta.value[key]
      const unlockInfo = slotUnlockMeta.value[key]
      const autoEnabled = !!slotAutomation.value[key]
      const extraActive = !!slotActiveFlag.value[key]

      let isRunning = false
      let progress = 0
      let remainingSec = DEFAULT_RUN_DURATION_SEC
      let totalSec = runMeta?.durationSec || DEFAULT_RUN_DURATION_SEC

      if (type === 'bus') {
        totalSec = runMeta?.durationSec || getRunDurationSec('bus')
      }

      let elapsedMs = 0
      let elapsedSec = 0

      if (runMeta) {
        elapsedMs = Math.max(0, nowMs - runMeta.startedAtMs)
        elapsedSec = elapsedMs / 1000

        if (elapsedSec < totalSec) {
          isRunning = true
          remainingSec = Math.max(0, totalSec - elapsedSec)
        } else {
          isRunning = false
          remainingSec = 0
        }
      }

      if (runMeta && totalSec > 0) {
        const durationMs = totalSec * 1000
        const ratio = Math.min(1, Math.max(0, elapsedMs / durationMs))
        progress = ratio
      } else {
        progress = 0
      }

      let isUnlocking = false
      let unlockProgress = 0
      let unlockRemainingSec = SLOT_UNLOCK_DURATION_SEC

      if (unlockInfo) {
        const unlockElapsed = Math.max(
          0,
          (nowMs - unlockInfo.startedAtMs) / 1000,
        )
        const unlockTotal =
          unlockInfo.durationSec || SLOT_UNLOCK_DURATION_SEC

        if (unlockElapsed < unlockTotal) {
          isUnlocking = true
          unlockProgress = Math.min(1, unlockElapsed / unlockTotal)
          unlockRemainingSec = Math.max(0, unlockTotal - unlockElapsed)
        } else {
          isUnlocking = false
          unlockProgress = 1
          unlockRemainingSec = 0
        }
      }

      let state = 'locked'
      const isUnlocked = unlockedTransports.value.includes(type)
      if (isUnlocked) {
        const isBaseActiveSlot = id === 1
        const isLogicalActive = isBaseActiveSlot || extraActive

        if (isLogicalActive || autoEnabled || runMeta) {
          state = 'active'
        } else if (isUnlocking) {
          state = 'unlocking'
        } else {
          state = 'empty'
        }
      }

      // 버스용 정류장/방향/잔여 시간 + 물방울 위치 + 상태 텍스트
      let currentStopIndex = 0
      let nextStopIndex = 0
      let direction: 'forward' | 'backward' = 'forward'
      let inDwell = false
      let dwellRemainingSec = 0
      let travelRemainingSec = 0
      let trackPositionRatio = 0
      let statusText = ''

      // 슬롯별 승/하차/탑승자 수치 (디폴트 0)
      let lastLoopIndexForSlot = 0
      let lastBoardForSlot = 0
      let lastDeboardForSlot = 0
      let lastPassengersForSlot = 0
      let lastCapacityForSlot =
        VILLAGE_BUS_BASE_CONFIG.baseCapacity
      let lastStopsPerLoopForSlot = busStopsPerLoop

      if (type === 'bus' && runMeta) {
        const slotState = ensureBusRuntimeState(key)

        const phase = getBusPhaseInfo(slotState, runMeta, nowMs)
        const uniqueStops = phase.uniqueStops || busUnique

        direction = phase.direction === 'backward' ? 'backward' : 'forward'
        currentStopIndex = Math.max(
          1,
          Math.min(uniqueStops, phase.physicalStopIndex || 0),
        )
        nextStopIndex = Math.max(
          1,
          Math.min(
            uniqueStops,
            phase.nextPhysicalStopIndex || currentStopIndex,
          ),
        )
        inDwell = !!phase.inDwell
        dwellRemainingSec = phase.dwellRemainingSec || 0
        travelRemainingSec = phase.travelRemainingSec || 0
        trackPositionRatio =
          uniqueStops > 1
            ? Math.min(
                1,
                Math.max(0, phase.trackPositionRatio ?? 0),
              )
            : 0

        // 슬롯별 마지막 승·하차/탑승자 정보
        const lastLoopIndex =
          (slotState as any).lastLoopStopIndex ||
          (slotState as any).lastStopIndex ||
          0
        const lastStopsPerLoop =
          slotState.stopsPerLoop || busStopsPerLoop
        const board = (slotState as any).lastBoard || 0
        const deboard = (slotState as any).lastDeboard || 0
        const passengers = slotState.currentPassengers || 0
        const capacity =
          slotState.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity

        lastLoopIndexForSlot = lastLoopIndex
        lastBoardForSlot = board
        lastDeboardForSlot = deboard
        lastPassengersForSlot = passengers
        lastCapacityForSlot = capacity
        lastStopsPerLoopForSlot = lastStopsPerLoop

        if (isUnlocked) {
          if (inDwell) {
            if (lastLoopIndex === 0) {
              statusText = `${currentStopIndex}번 정류장 정차중`
            } else if (lastLoopIndex === 1) {
              statusText = `${currentStopIndex}번 정류장 정차중 승차 ${board}명`
            } else if (lastLoopIndex === lastStopsPerLoop) {
              statusText = `${currentStopIndex}번 정류장 정차중 하차 ${deboard}명 → 0명`
            } else {
              statusText = `${currentStopIndex}번 정류장 정차중 승차 ${board}명, 하차 ${deboard}명`
            }
          } else {
            if (lastLoopIndex === 0) {
              statusText = `이동중 ${currentStopIndex}→${nextStopIndex} 정류장`
            } else {
              statusText = `이동중 ${currentStopIndex}→${nextStopIndex} 정류장 승차 ${board}명, 하차 ${deboard}명, 탑승자 ${passengers}/${capacity}명`
            }
          }
        }
      }

      const cfg = transportConfigMap[type]
      const routeName =
        transportRouteNames[type] || `${cfg?.label || type} 기본 노선`

      // ★ 슬롯별 lastStopInfo 객체 (뷰에서 승·하차/탑승 표시용)
      const lastStopInfoForSlot =
        type === 'bus'
          ? {
              loopIndex: lastLoopIndexForSlot,
              board: lastBoardForSlot,
              deboard: lastDeboardForSlot,
              passengers: lastPassengersForSlot,
              capacity: lastCapacityForSlot,
              stopsPerLoop: lastStopsPerLoopForSlot,
            }
          : null

      return {
        id,
        state,
        autoEnabled,
        isRunning,
        progress,
        remainingSec,
        remainingText: formatRemainingText(remainingSec, isRunning),
        routeName,

        // 버스 정류장 표시용
        currentStopIndex,
        nextStopIndex,
        direction,
        inDwell,
        dwellRemainingSec,
        travelRemainingSec,
        trackPositionRatio,
        statusText,

        // 슬롯별 승/하차/탑승자/정원
        lastLoopIndex: lastLoopIndexForSlot,
        lastBoard: lastBoardForSlot,
        lastDeboard: lastDeboardForSlot,
        passengers: lastPassengersForSlot,
        capacity: lastCapacityForSlot,

        // ★ 새로 추가: 슬롯별 마지막 정류장 정보 객체
        lastStopInfo: lastStopInfoForSlot,

        isUnlocking,
        unlockProgress,
        unlockRemainingSec,
        unlockRemainingText: formatUnlockRemainingText(
          unlockRemainingSec,
        ),
      }
    }

    for (const type of transportTypes) {
      const cfg = transportConfigMap[type]
      const slotCount = cfg ? cfg.maxSlots : 10
      const slots = Array.from(
        { length: slotCount },
        (_, index) => buildSlot(type, index),
      )
      result[type] = slots
    }

    return result
  })

  // ─────────────────────────────────────────────
  // 슬롯/운행 제어
  // ─────────────────────────────────────────────
  function setActiveMenu(key: string) {
    if (key !== 'bus') return
    activeMenu.value = key
  }

  function unlockTransport(type: string) {
    if (!isLeader.value) {
      console.log('[idle] unlockTransport ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (unlockedTransports.value.includes(type)) return

    const cfg = transportConfigMap[type]
    const isFreeStarter = cfg?.isStarter && !hasAnyStarterUnlocked.value

    if (!isFreeStarter) {
      const cost = getTransportUnlockCost(type)
      if (idleFunds.value < cost) return
      idleFunds.value -= cost
    }

    unlockedTransports.value = [...unlockedTransports.value, type]
    requestSave(true)
  }

  /**
   * 버스 슬롯용: 1루프 전체 스크립트를 미리 만들고,
   * 첫 정류장(1스텝)은 즉시 반영 + 나머지는 타이머에서 순서대로 적용
   */
  function createInitialBusRunMetaForSlot(
    slotKeyValue: string,
    nowMs: number,
  ): {
    meta: SlotRunMeta
    income: number
  } {
    const stateForSlot = ensureBusRuntimeState(slotKeyValue)
    const rawScript = buildBusRunScript(stateForSlot)

    const script: BusRunScript = {
      totalDurationSec: rawScript.totalDurationSec,
      totalStops: rawScript.totalStops,
      steps: (rawScript.steps || []).map((s: any) => ({
        loopStopIndex: s.loopStopIndex,
        physicalStopIndex: s.physicalStopIndex,
        board: s.board,
        deboard: s.deboard,
        income: s.income,
        passengersAfter: s.passengersAfter,
      })),
    }

    const durationSec =
      script.totalDurationSec || getRunDurationSec('bus')

    let runtimeState: BusRuntimeState = stateForSlot
    let immediateIncome = 0
    let stopsProcessed = 0

    if (script.steps.length > 0) {
      const first = script.steps[0]
      stopsProcessed = 1

      const nextTotalIncome =
        (runtimeState.totalIncome || 0) + first.income

      runtimeState = {
        ...runtimeState,
        currentPassengers: first.passengersAfter,
        totalIncome: nextTotalIncome,
        lastStopIndex: first.loopStopIndex,
        lastLoopStopIndex: first.loopStopIndex,
        lastPhysicalStopIndex: first.physicalStopIndex,
        lastBoard: first.board,
        lastDeboard: first.deboard,
      } as BusRuntimeState

      immediateIncome = first.income
    }

    busRuntimeStates.value = {
      ...busRuntimeStates.value,
      [slotKeyValue]: runtimeState,
    }

    // 라인 요약도 첫 정류장 기준으로 갱신
    villageBusState.value = {
      ...villageBusState.value,
      capacity: runtimeState.capacity,
      stopsPerLoop: runtimeState.stopsPerLoop,
      currentPassengers: runtimeState.currentPassengers,
      totalIncome: runtimeState.totalIncome,
      lastStopIndex: (runtimeState as any).lastStopIndex || 0,
      lastLoopStopIndex:
        (runtimeState as any).lastLoopStopIndex || 0,
      lastPhysicalStopIndex:
        (runtimeState as any).lastPhysicalStopIndex || 0,
      lastBoard: (runtimeState as any).lastBoard || 0,
      lastDeboard: (runtimeState as any).lastDeboard || 0,
    }

    const meta: SlotRunMeta = {
      startedAtMs: nowMs,
      durationSec,
      stopsProcessed,
      ownerClientId: CLIENT_ID,
      script,
    }

    return { meta, income: immediateIncome }
  }

  function handleClickRunSlot(type: string, id: number) {
    if (!isLeader.value) {
      console.log('[idle] runSlot ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return

    const key = slotKey(type, id)
    const existing = slotRunMeta.value[key]
    const nowMs = logicNowMs.value

    if (existing) {
      const durationSecExisting =
        existing.durationSec || getRunDurationSec(type)
      const elapsedSecExisting = Math.max(
        0,
        (nowMs - existing.startedAtMs) / 1000,
      )

      if (elapsedSecExisting < durationSecExisting) {
        // 아직 이전 운행이 끝나지 않은 슬롯 → 무시
        return
      }

      const cleaned: Record<string, SlotRunMeta> = {
        ...slotRunMeta.value,
      }
      delete cleaned[key]
      slotRunMeta.value = cleaned
    }

    const nextMeta: Record<string, SlotRunMeta> = {
      ...slotRunMeta.value,
    }

    if (type === 'bus') {
      const { meta: busMeta, income } =
        createInitialBusRunMetaForSlot(key, nowMs)
      nextMeta[key] = busMeta
      slotRunMeta.value = nextMeta
      if (income > 0) idleFunds.value += income
    } else {
      const durationSec = getRunDurationSec(type)
      nextMeta[key] = {
        startedAtMs: nowMs,
        durationSec,
        ownerClientId: CLIENT_ID,
      }
      slotRunMeta.value = nextMeta
    }

    requestSave(true)
  }

  function handleToggleAuto(type: string, id: number) {
    if (!isLeader.value) {
      console.log('[idle] toggleAuto ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return

    const key = slotKey(type, id)
    const current = !!slotAutomation.value[key]
    if (current) return

    const cost = getAutoRunCost(type)
    if (idleFunds.value < cost) return
    idleFunds.value -= cost

    const nextAuto = { ...slotAutomation.value, [key]: true }

    if (!slotRunMeta.value[key]) {
      const nowMs = logicNowMs.value
      const nextMeta: Record<string, SlotRunMeta> = {
        ...slotRunMeta.value,
      }

      if (type === 'bus') {
        const { meta: busMeta, income } =
          createInitialBusRunMetaForSlot(key, nowMs)
        nextMeta[key] = busMeta
        slotRunMeta.value = nextMeta
        if (income > 0) idleFunds.value += income
      } else {
        const durationSec = getRunDurationSec(type)
        nextMeta[key] = {
          startedAtMs: nowMs,
          durationSec,
          ownerClientId: CLIENT_ID,
        }
        slotRunMeta.value = nextMeta
      }
    }

    slotAutomation.value = nextAuto
    requestSave(true)
  }

  function handleClickActivateEmptySlot(type: string, id: number) {
    if (!isLeader.value) {
      console.log('[idle] activateSlot ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return
    if (id === 1) return

    const key = slotKey(type, id)

    if (slotActiveFlag.value[key]) return
    if (slotUnlockMeta.value[key]) return

    const cost = getSlotActivationCost(type)
    if (idleFunds.value < cost) return
    idleFunds.value -= cost

    const nowMs = logicNowMs.value

    slotUnlockMeta.value = {
      ...slotUnlockMeta.value,
      [key]: {
        startedAtMs: nowMs,
        durationSec: SLOT_UNLOCK_DURATION_SEC,
      },
    }

    requestSave(true)
  }

  function handleDeleteActiveSlot(type: string, id: number) {
    if (!isLeader.value) {
      console.log('[idle] deleteSlot ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return
    if (id === 1) return

    const key = slotKey(type, id)

    const nextActiveFlag = { ...slotActiveFlag.value }
    const nextAutomation = { ...slotAutomation.value }
    const nextRunMeta = { ...slotRunMeta.value }
    const nextUnlockMeta = { ...slotUnlockMeta.value }
    const nextBusRuntimeStates = { ...busRuntimeStates.value }

    delete nextActiveFlag[key]
    delete nextAutomation[key]
    delete nextRunMeta[key]
    delete nextUnlockMeta[key]
    delete nextBusRuntimeStates[key]

    slotActiveFlag.value = nextActiveFlag
    slotAutomation.value = nextAutomation
    slotRunMeta.value = nextRunMeta
    slotUnlockMeta.value = nextUnlockMeta
    busRuntimeStates.value = nextBusRuntimeStates

    requestSave(true)
  }

  // ★ 연구는 “1회만” 가능하게 막는 버전
  function handleClickBusResearch(key: string) {
    if (!isLeader.value) {
      console.log('[idle] busResearch ignored: not leader')
      return
    }

    const cfg = VILLAGE_BUS_RESEARCH_CATALOG[key]
    if (!cfg) return

    const baseResearch: VillageBusResearchState = {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
      ...(villageBusState.value.research || {}),
    }

    // 이미 완료된 연구면 바로 리턴 (재연구 불가)
    const alreadyDone =
      (key === 'capacityUpgrade' && baseResearch.capacityUpgradeDone) ||
      (key === 'lineExtension' && baseResearch.lineExtensionDone) ||
      (key === 'peakRush' && baseResearch.peakRushDone)

    if (alreadyDone) {
      console.log('[idle] busResearch ignored: already done', key)
      return
    }

    // 이미 진행중인 연구면 무시
    if (busResearchProgress.value[key]) {
      console.log('[idle] busResearch ignored: already in progress', key)
      return
    }

    if (idleFunds.value < cfg.cost) return

    idleFunds.value -= cfg.cost

    const nowMs = logicNowMs.value
    const durationSec = cfg.timeSec || 0

    busResearchProgress.value = {
      ...busResearchProgress.value,
      [key]: {
        startedAtMs: nowMs,
        durationSec,
      },
    }

    requestSave(true)
  }

  function handleStartBusReconfig() {
    if (!isLeader.value) {
      console.log('[idle] busReconfig ignored: not leader')
      return
    }

    if (!busHasUnappliedUpgrade.value) return
    if (busReconfigMeta.value) return

    const nowMs = logicNowMs.value
    busReconfigMeta.value = {
      startedAtMs: nowMs,
      durationSec: BUS_RECONFIG_SEC,
    }

    requestSave(true)
  }

  function handleManualSave() {
    if (!isLeader.value) {
      console.log('[idle] manualSave ignored: not leader')
      return
    }
    requestSave(true)
  }

  function handleResetIdleState() {
    if (!isLeader.value) {
      console.log('[idle] resetIdleState ignored: not leader')
      return
    }

    idleFunds.value = 0
    unlockedTransports.value = []
    villageBusState.value = createInitialVillageBusState()
    busRuntimeStates.value = {}
    slotAutomation.value = {}
    slotRunMeta.value = {}
    slotUnlockMeta.value = {}
    slotActiveFlag.value = {}
    busReconfigMeta.value = null
    busResearchProgress.value = {}

    requestSave(true)
  }

  // ─────────────────────────────────────────────
  // 시간 흐름에 따른 슬롯/버스 상태 업데이트 + 자동 저장
  // (실제 시간인 logicNowMs 기준, 0.2초마다 호출됨)
  // ─────────────────────────────────────────────
  watch(
    logicNowMs,
    (now) => {
      const nowMs = now

      // 리더 하트비트
      if (user.value && isLeader.value && !IS_LOCALHOST) {
        if (nowMs - lastLeaderHeartbeatMs >= LEADER_HEARTBEAT_MS) {
          lastLeaderHeartbeatMs = nowMs
          try {
            const uid = user.value.uid
            const refDoc = getIdleDocRef(uid)
            setDoc(
              refDoc,
              {
                leaderClientId: CLIENT_ID,
                leaderLastSeenAt: nowMs,
              },
              { merge: true },
            ).catch((err) => {
              console.warn('idle leader heartbeat failed:', err)
            })
          } catch (err) {
            console.warn('idle leader heartbeat error:', err)
          }
        }
      }

      if (
        user.value &&
        !IS_LOCALHOST &&
        !isLeader.value &&
        remoteLeaderLastSeenAt.value
      ) {
        const last = remoteLeaderLastSeenAt.value
        if (last && nowMs - last > LEADER_EXPIRE_MS) {
          console.log(
            '[idle] leader expired by local timer, take leadership',
            {
              lastLeaderClientId: remoteLeaderClientId.value,
              lastLeaderLastSeenAt: last,
              nowMs,
            },
          )
          isLeader.value = true
          remoteLeaderClientId.value = CLIENT_ID
          remoteLeaderLastSeenAt.value = nowMs
          attachBeforeUnload(user.value.uid)
          requestSave(true)
        }
      }

      if (user.value && isLeader.value) {
        if (nowMs - lastAutoSaveMs >= AUTO_SAVE_INTERVAL_MS) {
          lastAutoSaveMs = nowMs
          requestSave(true)
        }
      }

      // 1) 연구 타이머 처리
      if (Object.keys(busResearchProgress.value).length > 0) {
        const progressMap = { ...busResearchProgress.value }
        let progressChanged = false

        const baseResearch: VillageBusResearchState = {
          capacityUpgradeDone: false,
          lineExtensionDone: false,
          peakRushDone: false,
          ...(villageBusState.value.research || {}),
        }
        const research: VillageBusResearchState = { ...baseResearch }
        let researchUpdated = false

        for (const [key, info] of Object.entries(progressMap)) {
          const cfg = (VILLAGE_BUS_RESEARCH_CATALOG as any)[key]
          if (!cfg) continue

          const elapsedSec = Math.max(
            0,
            (nowMs - info.startedAtMs) / 1000,
          )
          const durationSec = info.durationSec || cfg.timeSec || 0

          if (durationSec > 0 && elapsedSec >= durationSec) {
            // 해당 연구 완료
            if (key === 'capacityUpgrade' && !research.capacityUpgradeDone) {
              research.capacityUpgradeDone = true
              researchUpdated = true
            }
            if (key === 'lineExtension' && !research.lineExtensionDone) {
              research.lineExtensionDone = true
              researchUpdated = true
            }
            if (key === 'peakRush' && !research.peakRushDone) {
              research.peakRushDone = true
              researchUpdated = true
            }

            delete progressMap[key]
            progressChanged = true
          }
        }

        if (researchUpdated) {
          villageBusState.value = {
            ...villageBusState.value,
            research,
          }
        }

        if (progressChanged) {
          busResearchProgress.value = progressMap
          requestSave(true)
        }
      }

      let currentRunMeta: Record<string, SlotRunMeta> = {
        ...slotRunMeta.value,
      }
      let totalIncome = 0

      for (const [key, meta] of Object.entries(currentRunMeta)) {
        if (meta.ownerClientId && meta.ownerClientId !== CLIENT_ID) {
          continue
        }

        const elapsedSec = Math.max(
          0,
          (nowMs - meta.startedAtMs) / 1000,
        )
        const [type] = key.split('-')

        if (type === 'bus') {
          const stateForSlot = ensureBusRuntimeState(key)
          const script = meta.script
          const totalStopsFromState =
            stateForSlot.stopsPerLoop ||
            VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
          const totalStops =
            script?.totalStops || totalStopsFromState

          const durationSec =
            meta.durationSec || getBusRunDuration(stateForSlot)

          const alreadyProcessed = meta.stopsProcessed || 0
          const shouldProcessed = Math.min(
            totalStops,
            Math.floor(elapsedSec / BUS_CYCLE_SEC) + 1,
          )

          if (script && shouldProcessed > alreadyProcessed) {
            const steps = script.steps || []
            const startIndex = alreadyProcessed
            const endIndex = Math.min(
              shouldProcessed,
              script.totalStops,
            )

            let currentState: BusRuntimeState = stateForSlot

            for (let i = startIndex; i < endIndex; i += 1) {
              const step = steps[i]
              if (!step) break

              const nextTotalIncome =
                (currentState.totalIncome || 0) + step.income

              currentState = {
                ...currentState,
                currentPassengers: step.passengersAfter,
                totalIncome: nextTotalIncome,
                lastStopIndex: step.loopStopIndex,
                lastLoopStopIndex: step.loopStopIndex,
                lastPhysicalStopIndex: step.physicalStopIndex,
                lastBoard: step.board,
                lastDeboard: step.deboard,
              } as BusRuntimeState

              totalIncome += step.income
            }

            busRuntimeStates.value = {
              ...busRuntimeStates.value,
              [key]: currentState,
            }

            // 요약용 라인 상태도 마지막 처리 슬롯 기준으로 갱신
            villageBusState.value = {
              ...villageBusState.value,
              capacity: currentState.capacity,
              stopsPerLoop: currentState.stopsPerLoop,
              currentPassengers: currentState.currentPassengers,
              totalIncome: currentState.totalIncome,
              lastStopIndex:
                (currentState as any).lastStopIndex || 0,
              lastLoopStopIndex:
                (currentState as any).lastLoopStopIndex || 0,
              lastPhysicalStopIndex:
                (currentState as any).lastPhysicalStopIndex ||
                0,
              lastBoard:
                (currentState as any).lastBoard || 0,
              lastDeboard:
                (currentState as any).lastDeboard || 0,
            }

            meta.stopsProcessed = shouldProcessed
          }

          if (elapsedSec >= durationSec) {
            const isAuto = !!slotAutomation.value[key]
            if (isAuto) {
              const { meta: busMeta, income } =
                createInitialBusRunMetaForSlot(key, nowMs)
              currentRunMeta[key] = busMeta
              totalIncome += income
            } else {
              delete currentRunMeta[key]
            }
          } else {
            currentRunMeta[key] = meta
          }

          continue
        }

        const durationSec = meta.durationSec || DEFAULT_RUN_DURATION_SEC

        if (elapsedSec >= durationSec) {
          const cfg = transportConfigMap[type]
          const income = cfg?.baseIncomePerSlot || 0
          totalIncome += income

          const isAuto = !!slotAutomation.value[key]

          if (isAuto) {
            currentRunMeta[key] = {
              startedAtMs: nowMs,
              durationSec,
              ownerClientId: CLIENT_ID,
            }
          } else {
            delete currentRunMeta[key]
          }
        }
      }

      if (busReconfigMeta.value) {
        const info = busReconfigMeta.value
        const elapsedReconfig = Math.max(
          0,
          (nowMs - info.startedAtMs) / 1000,
        )
        const durationReconfig =
          info.durationSec || BUS_RECONFIG_SEC

        if (elapsedReconfig >= durationReconfig) {
          villageBusState.value = applyVillageBusResearchToState(
            villageBusState.value,
          )

          // 연구 적용 후 슬롯별 버스 상태에도 capacity/stopsPerLoop 반영
          const line = villageBusState.value
          const updatedStates: Record<string, BusRuntimeState> = {}
          for (const [slotKeyValue, rt] of Object.entries(
            busRuntimeStates.value,
          )) {
            updatedStates[slotKeyValue] = {
              ...rt,
              capacity: line.capacity,
              stopsPerLoop: line.stopsPerLoop,
              research: {
                capacityUpgradeDone: false,
                lineExtensionDone: false,
                peakRushDone: false,
                ...(line.research || {}),
              },
            }
          }
          busRuntimeStates.value = updatedStates

          busReconfigMeta.value = null
        }
      }

      slotRunMeta.value = currentRunMeta

      if (totalIncome > 0) {
        idleFunds.value += totalIncome
      }

      const currentUnlockMeta = { ...slotUnlockMeta.value }
      const nextActiveFlag = { ...slotActiveFlag.value }

      for (const [key, info] of Object.entries(currentUnlockMeta)) {
        const elapsedSec = Math.max(
          0,
          (nowMs - info.startedAtMs) / 1000,
        )
        const durationSec =
          info.durationSec || SLOT_UNLOCK_DURATION_SEC

        if (elapsedSec >= durationSec) {
          nextActiveFlag[key] = true
          delete currentUnlockMeta[key]
        }
      }

      slotUnlockMeta.value = currentUnlockMeta
      slotActiveFlag.value = nextActiveFlag
    },
    { flush: 'sync' },
  )

  return {
    // 리더/저장
    isLeader,
    handleManualSave,
    handleResetIdleState,

    // 시간/자금/로그인
    formattedGameTime,
    idleFunds,
    formattedIdleFunds,
    isLoggedIn,
    handleLogin,
    handleLogout,

    // 운송수단/해금
    transportConfigs,
    activeMenu,
    setActiveMenu,
    currentTransportLabel,
    currentSlotCount,
    isCurrentTransportUnlocked,
    isCurrentStarterFree,
    currentUnlockStage,
    currentTransportUnlockCost,
    currentResearchDescription,
    canAffordSlotActivation,
    canAffordAutoRun,
    canAffordTransportUnlock,
    getSlotActivationCost,
    getAutoRunCost,
    unlockTransport,

    // 버스 관련
    villageBusState,
    busLastStopInfo,
    busUniqueStops,
    mapSegmentToLineStop,
    busResearchList,
    busHasUnappliedUpgrade,
    BUS_RECONFIG_SEC,
    busReconfigMeta,
    formatPhaseRemaining,
    handleClickBusResearch,
    handleStartBusReconfig,

    // 슬롯/운행
    transportSlots,
    handleClickRunSlot,
    handleToggleAuto,
    handleClickActivateEmptySlot,
    handleDeleteActiveSlot,
  }
}
