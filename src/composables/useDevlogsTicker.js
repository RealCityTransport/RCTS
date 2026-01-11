// src/composables/useDevlogsTicker.js
import { computed, onBeforeUnmount, ref } from 'vue'
import { getApp } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

/**
 * status: plan -> doing -> done
 *
 * ✅ 정렬(리스트)
 * - plan: orderMs(오래된→최신) 우선, 없으면 createdAtMs
 * - doing: orderMs(오래된→최신) 우선, 없으면 createdAtMs
 * - done: doneAtMs(최신→오래된) 우선, 없으면 createdAtMs
 *
 * ✅ 알림(기차)
 * - done: 최근 10개를 뽑되, 표시만 오래된→최신
 * - doing: ✅ "상단 2개" (Devlog 진행 탭에서 위 2개)
 * - plan:  "상단 5개" (Devlog 예정 탭에서 위 5개)
 *
 * ✅ 완료 자동 정리(prune)
 * - done가 20개 초과 시, 21번째(가장 오래된 것)부터 Firestore 문서 삭제
 */
export function useDevlogsTicker() {
  const db = getFirestore(getApp())

  const rawDocs = ref([])
  const loading = ref(true)
  const error = ref(null)

  let unsub = null

  const start = () => {
    if (unsub) return
    loading.value = true
    error.value = null

    const col = collection(db, 'devlogs')
    // ✅ 인덱스 부담 줄이려고 단일 orderBy만 사용
    const qAll = query(col, orderBy('createdAtMs', 'desc'), limit(300))

    unsub = onSnapshot(
      qAll,
      (snap) => {
        rawDocs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        loading.value = false
      },
      (e) => {
        error.value = e
        loading.value = false
      },
    )
  }

  const stop = () => {
    if (unsub) unsub()
    unsub = null
  }

  onBeforeUnmount(() => stop())

  const activeDocs = computed(() =>
    rawDocs.value.filter((x) => x && x.active === true && typeof x.createdAtMs === 'number'),
  )

  const orderKey = (x) => (typeof x?.orderMs === 'number' ? x.orderMs : (x?.createdAtMs ?? 0))
  const doneKey = (x) => (typeof x?.doneAtMs === 'number' ? x.doneAtMs : (x?.createdAtMs ?? 0))

  const planItems = computed(() =>
    activeDocs.value
      .filter((x) => x.status === 'plan')
      .sort((a, b) => orderKey(a) - orderKey(b)),
  )

  const doingItems = computed(() =>
    activeDocs.value
      .filter((x) => x.status === 'doing')
      .sort((a, b) => orderKey(a) - orderKey(b)),
  )

  // ✅ 전체 완료(최신→오래된)
  const doneItemsAllDesc = computed(() =>
    activeDocs.value
      .filter((x) => x.status === 'done')
      .sort((a, b) => doneKey(b) - doneKey(a)),
  )

  // ✅ 완료는 페이지에서 최대 20개만 로드
  const doneItems = computed(() => doneItemsAllDesc.value.slice(0, 20))

  // ✅ 완료 21번째부터(가장 오래된) 삭제 대상
  const doneOverflowItems = computed(() => doneItemsAllDesc.value.slice(20))
  const doneOverflowIds = computed(() => doneOverflowItems.value.map((x) => x.id).filter(Boolean))

  // ✅ 알림(기차) 한 바퀴 구성
  const tickerTrainItems = computed(() => {
    const doneLatest10 = doneItemsAllDesc.value.slice(0, 10) // 최신 10
    const doneForDisplay = [...doneLatest10].reverse() // 표시: 오래된→최신

    // ✅ FIX: 진행은 "상단 2개"가 나와야 함 (Devlog 진행 탭 위 2개)
    const doingTop2 = doingItems.value.slice(0, 2)

    // plan: 드래그 순서에서 상단 5개
    const planTop5 = planItems.value.slice(0, 5)

    return [...doneForDisplay, ...doingTop2, ...planTop5]
  })

  const addDevlog = async ({ title, detail }) => {
    const cleanTitle = String(title ?? '').trim()
    const cleanDetail = String(detail ?? '').trim()
    if (!cleanTitle) throw new Error('제목은 필수야.')

    const nowMs = Date.now()

    const refDoc = await addDoc(collection(db, 'devlogs'), {
      title: cleanTitle,
      detail: cleanDetail,
      status: 'plan',
      active: true,
      createdAt: serverTimestamp(),
      createdAtMs: nowMs,
      // ✅ 기본: 맨 뒤에 붙이기
      orderMs: nowMs,
    })

    return refDoc.id
  }

  const updateDevlog = async (id, patch) => {
    if (!id) return
    const safe = {}
    if (patch && typeof patch === 'object') {
      if ('title' in patch) safe.title = String(patch.title ?? '').trim()
      if ('detail' in patch) safe.detail = String(patch.detail ?? '').trim()
    }
    await updateDoc(doc(db, 'devlogs', id), safe)
  }

  const setStatus = async (id, nextStatus) => {
    const ns = nextStatus === 'done' ? 'done' : nextStatus === 'doing' ? 'doing' : 'plan'
    const nowMs = Date.now()

    const safe = { status: ns }

    // ✅ plan/doing으로 이동 시: 기본은 “맨 뒤로”
    if (ns === 'plan' || ns === 'doing') {
      safe.orderMs = nowMs
    }

    if (ns === 'doing') {
      safe.doingAt = serverTimestamp()
      safe.doingAtMs = nowMs
    }

    if (ns === 'done') {
      safe.doneAt = serverTimestamp()
      safe.doneAtMs = nowMs
    }

    await updateDoc(doc(db, 'devlogs', id), safe)
  }

  const moveToDoing = async (id) => setStatus(id, 'doing')
  const moveDoingToPlan = async (id) => setStatus(id, 'plan')
  const moveDoingToDone = async (id) => setStatus(id, 'done')
  const moveDoneToPlan = async (id) => setStatus(id, 'plan')

  // ✅ 예정만 삭제(비활성) 허용
  const deactivatePlanOnly = async (id, status) => {
    const s = status === 'plan' ? 'plan' : status === 'doing' ? 'doing' : 'done'
    if (s !== 'plan') throw new Error('예정만 삭제할 수 있어.')
    await updateDoc(doc(db, 'devlogs', id), { active: false })
  }

  /**
   * ✅ 드래그 정렬 저장 (plan/doing만)
   * orderedIds: 화면에 보이는 순서대로 id 배열
   * orderMs: now + i 로 부여 (안전하고 충돌 적음)
   */
  const reorderStatus = async (status, orderedIds) => {
    const s = status === 'plan' ? 'plan' : status === 'doing' ? 'doing' : 'done'
    if (s === 'done') return
    if (!Array.isArray(orderedIds) || orderedIds.length <= 1) return

    const now = Date.now()
    const batch = writeBatch(db)

    for (let i = 0; i < orderedIds.length; i += 1) {
      const id = orderedIds[i]
      if (!id) continue
      batch.update(doc(db, 'devlogs', id), { orderMs: now + i })
    }

    await batch.commit()
  }

  /**
   * ✅ 완료 자동 정리(prune)
   * - done가 20개 초과면, 21번째(가장 오래된)부터 Firestore 문서를 삭제
   * - 관리자(DevlogPage에서 isAdmin일 때만 호출)만 실행하도록 설계
   */
  const pruneDoneOverflow = async (maxKeep = 20) => {
    const max = typeof maxKeep === 'number' && maxKeep > 0 ? Math.floor(maxKeep) : 20

    const all = doneItemsAllDesc.value
    if (!Array.isArray(all) || all.length <= max) return

    const overflow = all.slice(max) // 최신 max개 제외한 나머지(가장 오래된 묶음)
    if (!overflow.length) return

    const batch = writeBatch(db)

    for (const it of overflow) {
      if (!it?.id) continue
      batch.delete(doc(db, 'devlogs', it.id))
    }

    await batch.commit()
  }

  return {
    loading,
    error,
    rawDocs,

    planItems,
    doingItems,
    doneItems,

    doneOverflowIds,

    tickerTrainItems,

    start,
    stop,

    addDevlog,
    updateDevlog,
    moveToDoing,
    moveDoingToPlan,
    moveDoingToDone,
    moveDoneToPlan,
    deactivatePlanOnly,

    reorderStatus,

    pruneDoneOverflow,
  }
}
