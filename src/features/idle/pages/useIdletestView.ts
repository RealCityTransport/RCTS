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
} from '@/features/idle/transports/bus/busEngine'

import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import { db } from '@/libs/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

export function useIdletestView() {
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
        '마을버스: 기본요금 1,500원, 정원 25명(연구 시 40명), 기본 20개 정류장(연구 시 40개) 운행. 정류장마다 30초 정차 후 5분 이동하며, 승차 인원 기준으로 수익을 정산합니다.',
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

  // 연구 상태 타입 (필수 boolean)
  type VillageBusResearchState = {
    capacityUpgradeDone: boolean
    lineExtensionDone: boolean
    peakRushDone: boolean
  }

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
  // 게임 시간
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
  // 마을버스 라인 상태
  // ─────────────────────────────────────────────
  const villageBusState = ref(createInitialVillageBusState())

  function getGameTimeMs(v = gameTime.value) {
    if (!v) return 0
    if (v instanceof Date) return v.getTime()
    const n = Number(v)
    return Number.isNaN(n) ? 0 : n
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
    return {
      index: state.lastStopIndex || 0,
      board: state.lastBoard || 0,
      deboard: state.lastDeboard || 0,
      passengers: state.currentPassengers || 0,
      stopsPerLoop:
        state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop,
      capacity: state.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity,
    }
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
  const slotRunMeta = ref<Record<
    string,
    { startedAtMs: number; durationSec: number; stopsProcessed?: number }
  >>({})
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
    return {
      idleFunds: idleFunds.value,
      unlockedTransports: unlockedTransports.value,
      villageBusState: villageBusState.value,
      slotAutomation: slotAutomation.value,
      slotRunMeta: slotRunMeta.value,
      slotUnlockMeta: slotUnlockMeta.value,
      slotActiveFlag: slotActiveFlag.value,
    }
  }

  // ★ 즉시 저장용 헬퍼 (중요 액션에 사용)
  async function saveIdleStateNow() {
    const uid = user.value?.uid
    if (!uid) return

    try {
      const refDoc = getIdleDocRef(uid)
      const payload = buildSavePayload()
      console.log('[idle] saveIdleStateNow', uid, payload)
      await setDoc(refDoc, payload, { merge: true })
      console.log('[idle] saveIdleStateNow success', uid)
    } catch (err) {
      console.error('idle state save failed (now):', err)
    }
  }

  function scheduleSaveIdleState() {
    const uidAtSchedule = user.value?.uid
    if (!uidAtSchedule) return

    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(async () => {
      saveTimeout = null

      // 실행 시점에 유저가 바뀌었거나 로그아웃되어 있으면 저장 스킵
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
    }, 1000)
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
        return
      }

      console.log('[idle] subscribe idleStates', uid)
      const refDoc = getIdleDocRef(uid)
      idleUnsubscribe = onSnapshot(
        refDoc,
        (snap) => {
          if (snap.exists()) {
            console.log('[idle] snapshot exists', uid, snap.data())
            applyRemoteState(snap.data())
          } else {
            console.log('[idle] snapshot not exists (new doc)', uid)
            scheduleSaveIdleState()
          }
        },
        (err) => {
          console.error('idle state subscribe failed:', err)
        },
      )
    },
    { immediate: true },
  )

  watch(
    [
      idleFunds,
      unlockedTransports,
      villageBusState,
      slotAutomation,
      slotRunMeta,
      slotUnlockMeta,
      slotActiveFlag,
    ],
    () => {
      if (!user.value) return
      scheduleSaveIdleState()
    },
    { deep: true },
  )

  onUnmounted(() => {
    if (idleUnsubscribe) idleUnsubscribe()
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
    }
  })

  // ─────────────────────────────────────────────
  // 슬롯 빌드 (UI용)
  // ─────────────────────────────────────────────
  const transportSlots = computed(() => {
    const result: Record<
      string,
      Array<ReturnType<typeof buildSlot>>
    > = {}
    const nowMs = getGameTimeMs()

    const busState = villageBusState.value
    const busStopsPerLoop =
      busState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

    function buildSlot(type: string, index: number) {
      const id = index + 1
      const key = slotKey(type, id)
      const autoEnabled = !!slotAutomation.value[key]
      const runMeta = slotRunMeta.value[key]
      const unlockInfo = slotUnlockMeta.value[key]
      const extraActive = !!slotActiveFlag.value[key]

      let isRunning = false
      let progress = 0
      let remainingSec = DEFAULT_RUN_DURATION_SEC
      let totalSec = runMeta?.durationSec || DEFAULT_RUN_DURATION_SEC

      if (type === 'bus') {
        totalSec = runMeta?.durationSec || getRunDurationSec('bus')
      }

      if (runMeta) {
        const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
        if (elapsedSec < totalSec) {
          isRunning = true
          progress = Math.min(1, elapsedSec / totalSec)
          remainingSec = Math.max(0, totalSec - elapsedSec)
        } else {
          isRunning = false
          progress = 1
          remainingSec = 0
        }
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

      let currentStopIndex = 0
      let inDwell = false
      let dwellRemainingSec = 0
      let travelRemainingSec = 0

      if (type === 'bus' && runMeta) {
        const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
        const clamped =
          totalSec > 0 ? Math.min(elapsedSec, totalSec - 0.001) : 0
        const stopIndexBase = Math.floor(clamped / BUS_CYCLE_SEC)
        currentStopIndex = Math.min(
          busStopsPerLoop,
          stopIndexBase + 1,
        )
        const withinStop = clamped % BUS_CYCLE_SEC
        inDwell = withinStop < BUS_DWELL_SEC

        if (inDwell) {
          dwellRemainingSec = BUS_DWELL_SEC - withinStop
          travelRemainingSec = 0
        } else {
          const travelElapsed = withinStop - BUS_DWELL_SEC
          travelRemainingSec = Math.max(0, BUS_TRAVEL_SEC - travelElapsed)
          dwellRemainingSec = 0
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
        isUnlocking,
        unlockProgress,
        unlockRemainingSec,
        unlockRemainingText: formatUnlockRemainingText(
          unlockRemainingSec,
        ),
        currentStopIndex,
        inDwell,
        dwellRemainingSec,
        travelRemainingSec,
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

  function setActiveMenu(key: string) {
    if (key !== 'bus') return
    activeMenu.value = key
  }

  function unlockTransport(type: string) {
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

    // ★ 버스 해금 후 즉시 저장
    void saveIdleStateNow()
  }

  function createInitialBusRunMeta(nowMs: number) {
    const durationSec = getBusRunDuration(villageBusState.value)

    const { nextState, income } = simulateVillageBusStops(
      villageBusState.value,
      1,
    )
    villageBusState.value = nextState

    const meta = {
      startedAtMs: nowMs,
      durationSec,
      stopsProcessed: 1,
    }

    return { meta, income }
  }

  function handleClickRunSlot(type: string, id: number) {
    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return

    const key = slotKey(type, id)
    const meta = slotRunMeta.value[key]
    if (meta) return

    const nowMs = getGameTimeMs()
    const nextMeta = { ...slotRunMeta.value }

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
      }
      slotRunMeta.value = nextMeta
    }

    // ★ 수동 운행 시작 시 즉시 저장
    void saveIdleStateNow()
  }

  function handleToggleAuto(type: string, id: number) {
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
      const nowMs = getGameTimeMs()
      const nextMeta = { ...slotRunMeta.value }

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
        }
        slotRunMeta.value = nextMeta
      }
    }

    slotAutomation.value = nextAuto

    // ★ 자동운행 설정 시 즉시 저장
    void saveIdleStateNow()
  }

  function handleClickActivateEmptySlot(type: string, id: number) {
    if (!transportTypes.includes(type)) return
    if (!unlockedTransports.value.includes(type)) return
    if (id === 1) return

    const key = slotKey(type, id)

    if (slotActiveFlag.value[key]) return
    if (slotUnlockMeta.value[key]) return

    const cost = getSlotActivationCost(type)
    if (idleFunds.value < cost) return
    idleFunds.value -= cost

    const nowMs = getGameTimeMs()

    slotUnlockMeta.value = {
      ...slotUnlockMeta.value,
      [key]: {
        startedAtMs: nowMs,
        durationSec: SLOT_UNLOCK_DURATION_SEC,
      },
    }

    // ★ 슬롯 활성화 준비 시작도 즉시 저장
    void saveIdleStateNow()
  }

  function handleDeleteActiveSlot(type: string, id: number) {
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

    // ★ 슬롯 삭제도 즉시 저장
    void saveIdleStateNow()
  }

  function handleClickBusResearch(key: string) {
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

    // ★ 연구 상태 변경도 즉시 저장
    void saveIdleStateNow()
  }

  function handleStartBusReconfig() {
    if (!busHasUnappliedUpgrade.value) return
    if (busReconfigMeta.value) return

    const nowMs = getGameTimeMs()
    busReconfigMeta.value = {
      startedAtMs: nowMs,
      durationSec: BUS_RECONFIG_SEC,
    }

    // (busReconfigMeta는 지금 payload에 안 넣고 있어서 저장은 안 하지만,
    // 나중에 필요해지면 buildSavePayload에 포함시키면 됨)
  }

  watch(
    gameTime,
    () => {
      const nowMs = getGameTimeMs()

      let currentRunMeta = { ...slotRunMeta.value }
      let totalIncome = 0

      for (const [key, meta] of Object.entries(currentRunMeta)) {
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
            meta.durationSec || totalStops * BUS_CYCLE_SEC

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
            meta.stopsProcessed = shouldProcessed
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
