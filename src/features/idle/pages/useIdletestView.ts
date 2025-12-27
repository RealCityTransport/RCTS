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

// 슬롯 운행 메타 타입 (ownerClientId 추가)
type SlotRunMeta = {
  startedAtMs: number
  durationSec: number
  stopsProcessed?: number
  ownerClientId?: string
}

// 연구 상태 타입 (필수 boolean)
type VillageBusResearchState = {
  capacityUpgradeDone: boolean
  lineExtensionDone: boolean
  peakRushDone: boolean
}

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
        '마을버스: 기본요금 1,500원, 정원 25명(연구 시 40명), 기본 20개 정류장(왕복 기준 10개 정류장) 운행. 정류장마다 30초 정차 후 5분 이동하며, 승차 인원 기준으로 수익을 정산합니다.',
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
  // 마을버스 라인 상태
  // ─────────────────────────────────────────────
  const villageBusState = ref(createInitialVillageBusState())

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

  function formatRemainingText(remainingSec: number, isRunning: boolean) {
    if (!isRunning) return '대기 중'
    const s = Math.max(0, Math.floor(remainingSec))
    const m = Math.floor(s / 60)
    const r = s % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(r).padStart(2, '0')
    return `${mm}:${ss} 남음`
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

  function formatPhaseRemaining(sec: number) {
    const s = Math.max(0, Math.floor(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(r).padStart(2, '0')
    return `${mm}:${ss}`
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

  const busLastStopInfo = computed(() => {
    const state = villageBusState.value
    const stopsPerLoop =
      state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
    const baseCapacity =
      state.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity

    const totalStops = stopsPerLoop
    const uniqueStops = Math.max(1, Math.floor(totalStops / 2))

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
      // 루프 내 전체 정류장 수 (왕복 포함)
      stopsPerLoop,
      capacity: baseCapacity,
    }
  })

  // 물리 정류장 수 (왕복 기준: 20개 정류장 → 10개, 40개 → 20개)
  const busUniqueStops = computed(() => {
    const totalStops = busLastStopInfo.value.stopsPerLoop
    if (totalStops <= 0) return 1
    return Math.max(1, Math.floor(totalStops / 2))
  })

  const busResearchList = computed(() => {
    const baseResearch: VillageBusResearchState = {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
      ...(villageBusState.value.research || {}),
    }
    const r: VillageBusResearchState = baseResearch

    const items = [
      VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade,
      VILLAGE_BUS_RESEARCH_CATALOG.lineExtension,
    ]

    return items.map((cfg) => {
      let done = false
      if (cfg.key === 'capacityUpgrade') done = !!r.capacityUpgradeDone
      if (cfg.key === 'lineExtension') done = !!r.lineExtensionDone
      return {
        ...cfg,
        done,
        timeLabel: formatResearchTime(cfg.timeSec),
      }
    })
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
      slotRunMeta.value = { ...data.slotRunMeta }
    }

    if (data.slotUnlockMeta && typeof data.slotUnlockMeta === 'object') {
      slotUnlockMeta.value = { ...data.slotUnlockMeta }
    }

    if (data.slotActiveFlag && typeof data.slotActiveFlag === 'object') {
      slotActiveFlag.value = { ...data.slotActiveFlag }
    }
  }

  function buildSavePayload() {
    const now = Date.now()
    return {
      idleFunds: idleFunds.value,
      unlockedTransports: unlockedTransports.value,
      villageBusState: villageBusState.value,
      slotAutomation: slotAutomation.value,
      slotRunMeta: slotRunMeta.value,
      slotUnlockMeta: slotUnlockMeta.value,
      slotActiveFlag: slotActiveFlag.value,
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
        console.log('[idle] saveIdleState', uidAtSchedule, payload)
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

        // 로그아웃 상태:
        // - localhost에서는 저장 없이 로직만 동작해야 하므로 리더로 취급
        // - 배포 환경에서는 리더 아님
        isLeader.value = IS_LOCALHOST

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
            console.log('[idle] snapshot exists', uid, data)
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
    // 의존성 명시: 매 0.2초 재계산
    const nowMs = logicNowMs.value

    const result: Record<string, Array<ReturnType<typeof buildSlot>>> = {}

    const busState = villageBusState.value
    const busStopsPerLoop =
      busState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
    const busUnique = Math.max(1, Math.floor(busStopsPerLoop / 2))

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

      // 진행 비율
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
        const unlockTotal = unlockInfo.durationSec || SLOT_UNLOCK_DURATION_SEC

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

      if (type === 'bus' && runMeta) {
        const phase = getBusPhaseInfo(busState, runMeta, nowMs)

        const uniqueStops = phase.uniqueStops || busUnique

        direction = phase.direction === 'backward' ? 'backward' : 'forward'
        currentStopIndex = Math.max(
          1,
          Math.min(uniqueStops, phase.physicalStopIndex || 0),
        )
        nextStopIndex = Math.max(
          1,
          Math.min(uniqueStops, phase.nextPhysicalStopIndex || currentStopIndex),
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

        // 버스 상태 텍스트
        const last = busLastStopInfo.value
        const lastLoopIndex = last.loopIndex || 0
        const lastStopsPerLoop =
          last.stopsPerLoop || busStopsPerLoop
        const board = last.board || 0
        const deboard = last.deboard || 0
        const passengers = last.passengers || 0
        const capacity =
          last.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity

        if (isUnlocked) {
          if (inDwell) {
            // 정류장 정차 중
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
            // 이동 중
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

    if (type !== 'bus') return
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

  function createInitialBusRunMeta(nowMs: number): {
    meta: SlotRunMeta
    income: number
  } {
    const durationSec = getRunDurationSec('bus')

    const { nextState, income } = simulateVillageBusStops(
      villageBusState.value,
      1,
    )
    villageBusState.value = nextState

    const meta: SlotRunMeta = {
      startedAtMs: nowMs,
      durationSec,
      stopsProcessed: 1,
      ownerClientId: CLIENT_ID,
    }

    return { meta, income }
  }

  function handleClickRunSlot(type: string, id: number) {
    if (!isLeader.value) {
      console.log('[idle] runSlot ignored: not leader')
      return
    }

    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return

    const key = slotKey(type, id)
    const meta = slotRunMeta.value[key]
    if (meta) return

    const nowMs = logicNowMs.value
    const nextMeta: Record<string, SlotRunMeta> = {
      ...slotRunMeta.value,
    }

    if (type === 'bus') {
      const { meta: busMeta, income } = createInitialBusRunMeta(nowMs)
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
        const { meta: busMeta, income } = createInitialBusRunMeta(nowMs)
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

    delete nextActiveFlag[key]
    delete nextAutomation[key]
    delete nextRunMeta[key]
    delete nextUnlockMeta[key]

    slotActiveFlag.value = nextActiveFlag
    slotAutomation.value = nextAutomation
    slotRunMeta.value = nextRunMeta
    slotUnlockMeta.value = nextUnlockMeta

    requestSave(true)
  }

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

    const research: VillageBusResearchState = {
      ...baseResearch,
    }

    if (key === 'capacityUpgrade' && research.capacityUpgradeDone) return
    if (key === 'lineExtension' && research.lineExtensionDone) return
    if (key === 'peakRush' && research.peakRushDone) return

    if (idleFunds.value < cfg.cost) return

    idleFunds.value -= cfg.cost

    if (key === 'capacityUpgrade') research.capacityUpgradeDone = true
    if (key === 'lineExtension') research.lineExtensionDone = true
    if (key === 'peakRush') research.peakRushDone = true

    villageBusState.value = {
      ...villageBusState.value,
      research,
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
    if (!user.value) return
    if (!isLeader.value) {
      console.log('[idle] manualSave ignored: not leader')
      return
    }
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

      // 리더 하트비트: 2초마다 leaderLastSeenAt 갱신
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

      // 리더 타임아웃 감지: 현재 리더가 오래 응답 없으면 이 클라이언트가 승계
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

      // 10분 자동 저장 (로그인 + 리더일 때만)
      if (user.value && isLeader.value) {
        if (nowMs - lastAutoSaveMs >= AUTO_SAVE_INTERVAL_MS) {
          lastAutoSaveMs = nowMs
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
          const state = villageBusState.value
          const totalStops =
            state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
          const durationSec =
            meta.durationSec || getBusRunDuration(villageBusState.value)

          const alreadyProcessed = meta.stopsProcessed || 0
          const shouldProcessed = Math.min(
            totalStops,
            Math.floor(elapsedSec / BUS_CYCLE_SEC) + 1,
          )

          const newStops = shouldProcessed - alreadyProcessed

          if (newStops > 0) {
            const res = simulateVillageBusStops(
              villageBusState.value,
              newStops,
            )
            villageBusState.value = res.nextState
            totalIncome += res.income
            meta.stopsProcessed = alreadyProcessed + newStops
          }

          if (elapsedSec >= durationSec) {
            const isAuto = !!slotAutomation.value[key]
            if (isAuto) {
              const { meta: busMeta, income } =
                createInitialBusRunMeta(nowMs)
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
