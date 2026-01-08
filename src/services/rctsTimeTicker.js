import { getDatabase, ref, onValue, runTransaction, get, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDayKeyFromUtcMs(utcMs) {
  const kst = new Date(utcMs + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function kstMidnightUtcMsFromDayKey(dayKey) {
  const [y, m, d] = dayKey.split("-").map((x) => Number(x));
  return Date.UTC(y, m - 1, d, 0, 0, 0) - KST_OFFSET_MS;
}

/**
 * Cloud Functions 없이 "리더(락 소유자) 1명만" rcts_time tick을 보정 업데이트한다.
 *
 * - serverTimeOffset을 이용해 서버 기준 now를 만든다.
 * - lock(ownerUid/expiresAtUtcMs)을 트랜잭션으로 획득/연장한다.
 * - 리더일 때만 meta/public/private을 갱신한다.
 */
export function startRctsTimeTicker({ leaseMs = 15000, tickEveryMs = 5000 } = {}) {
  const db = getDatabase();
  const auth = getAuth();

  const offsetRef = ref(db, ".info/serverTimeOffset");
  const lockRef = ref(db, "rcts_time/lock");
  const metaRef = ref(db, "rcts_time/meta");
  const pubRef = ref(db, "rcts_time/public");
  const privRef = ref(db, "rcts_time/private");

  let serverOffsetMs = 0;
  let timer = null;

  // 서버 시간 오프셋 구독
  const off1 = onValue(offsetRef, (snap) => {
    serverOffsetMs = Number(snap.val() ?? 0);
  });

  const nowServerUtcMs = () => Date.now() + serverOffsetMs;

  async function tryAcquireOrExtendLease(uid) {
    const nowUtcMs = nowServerUtcMs();
    const newExpires = nowUtcMs + leaseMs;

    const res = await runTransaction(lockRef, (cur) => {
      const ownerUid = cur?.ownerUid ?? "";
      const expiresAtUtcMs = Number(cur?.expiresAtUtcMs ?? 0);

      // 비어있거나 만료되었거나 내가 소유 중이면 갱신 가능
      if (!ownerUid || expiresAtUtcMs <= nowUtcMs || ownerUid === uid) {
        return { ownerUid: uid, expiresAtUtcMs: newExpires };
      }
      return cur; // 다른 사람이 소유 중
    });

    const val = res.snapshot.val();
    return val?.ownerUid === uid && Number(val?.expiresAtUtcMs ?? 0) > nowUtcMs;
  }

  async function tickOnceAsLeader(uid) {
    const nowUtcMs = nowServerUtcMs();

    // (1) 리더 락 획득/연장
    const isLeader = await tryAcquireOrExtendLease(uid);
    if (!isLeader) return;

    // (2) meta 읽고 경과초 계산
    const metaSnap = await get(metaRef);
    const meta = metaSnap.val() || {};
    const lastUtcMs = Number(meta.lastTickAtUtcMs ?? 0);

    if (!lastUtcMs || lastUtcMs <= 0) {
      // lastTickAtUtcMs가 비어있으면 지금으로만 세팅
      await update(metaRef, { lastTickAtUtcMs: nowUtcMs });
      return;
    }

    const deltaSec = Math.floor((nowUtcMs - lastUtcMs) / 1000);
    if (deltaSec <= 0) return;

    // (3) 날짜키(KST) 계산 + 변경 시 리셋 준비
    const newDayKey = kstDayKeyFromUtcMs(nowUtcMs);
    const oldDayKey = String(meta.kstDayKey ?? "");

    const updates = {};

    if (oldDayKey !== newDayKey) {
      updates["rcts_time/meta/kstDayKey"] = newDayKey;
      updates["rcts_time/meta/dayStartUtcMs"] = kstMidnightUtcMsFromDayKey(newDayKey);
      updates["rcts_time/public/dayTick"] = 0; // 공개틱 리셋
    }

    // (4) tick 누적 (transaction으로 안전하게)
    await runTransaction(pubRef, (cur) => {
      const v = Number(cur?.dayTick ?? 0);
      return { dayTick: v + deltaSec };
    });

    await runTransaction(privRef, (cur) => {
      const v = Number(cur?.totalTick ?? 0);
      return { totalTick: v + deltaSec };
    });

    // (5) meta 반영: 누적된 만큼만 lastTickAtUtcMs 전진
    updates["rcts_time/meta/lastTickAtUtcMs"] = lastUtcMs + deltaSec * 1000;

    if (Object.keys(updates).length) {
      await update(ref(db), updates);
    }
  }

  function startLoop(uid) {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      tickOnceAsLeader(uid).catch(() => {});
    }, tickEveryMs);
  }

  // 로그인 상태를 기다렸다가 시작
  const off2 = onAuthStateChanged(auth, (user) => {
    if (!user?.uid) {
      if (timer) clearInterval(timer);
      timer = null;
      return;
    }
    startLoop(user.uid);
  });

  // stop 함수 반환
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
    off1();
    off2();
  };
}
