// src/composables/usePreviewRoutes.js
import { reactive } from 'vue';

const STORAGE_KEY = 'rcts_preview_routes_v4';

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byTransport: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { byTransport: {} };
    if (!parsed.byTransport || typeof parsed.byTransport !== 'object') parsed.byTransport = {};
    return parsed;
  } catch {
    return { byTransport: {} };
  }
}

function safeSave(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function randInt(min, max) {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return Math.floor(a + Math.random() * (b - a + 1));
}
function chance(prob01) {
  return Math.random() < prob01;
}
function pickRandom(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

/**
 * 버스 노선 풀 + 시간 규칙(요청 반영)
 */
function getRoutePoolByTransport(transportId) {
  if (transportId === 'bus') {
    return [
      { id: 'bus_city', name: '시내버스', type: 'range', minSec: 30 * 60, maxSec: 2 * 60 * 60 },
      { id: 'bus_metro', name: '광역버스', type: 'range', minSec: 60 * 60, maxSec: 3 * 60 * 60 },
      { id: 'bus_intercity', name: '시외버스', type: 'fixed', sec: 2 * 60 * 60 },
      { id: 'bus_express', name: '고속버스', type: 'express' },
    ];
  }

  return [
    { id: 'generic_1', name: '기본 노선 A', type: 'range', minSec: 20 * 60, maxSec: 60 * 60 },
    { id: 'generic_2', name: '기본 노선 B', type: 'range', minSec: 30 * 60, maxSec: 90 * 60 },
  ];
}

function computeDurationSec(routeDef) {
  if (!routeDef) return 30 * 60;

  if (routeDef.type === 'fixed') return Math.max(0, Number(routeDef.sec) || 0);
  if (routeDef.type === 'range') return randInt(routeDef.minSec || 0, routeDef.maxSec || 0);

  if (routeDef.type === 'express') {
    let minSec = 2 * 60 * 60;
    let maxSec = 5 * 60 * 60;
    if (chance(0.01)) {
      minSec = 5 * 60 * 60;
      maxSec = 8 * 60 * 60;
    }
    return randInt(minSec, maxSec);
  }

  return 30 * 60;
}

const state = reactive(safeLoad());

function ensureTransportState(transportId) {
  if (!transportId) return null;
  if (!state.byTransport[transportId]) {
    state.byTransport[transportId] = { slots: {} };
    safeSave(state);
  }
  return state.byTransport[transportId];
}

function buildAssignedRoute(routeDef, nowMs = Date.now()) {
  const durationSec = computeDurationSec(routeDef);
  return {
    routeId: routeDef.id,
    routeName: routeDef.name,
    assignedAt: nowMs,

    durationSec,
    startedAt: nowMs,
    endsAt: nowMs + durationSec * 1000,

    locked: true,
    // 자동 재시작 중복 방지용
    lastAutoRestartAt: null,
  };
}

export function usePreviewRoutes() {
  function getSlotRoute(transportId, slotIndex) {
    const t = ensureTransportState(transportId);
    if (!t) return null;
    return t.slots?.[String(slotIndex)] || null;
  }

  function getRemainingSec(transportId, slotIndex, nowMs = Date.now()) {
    const r = getSlotRoute(transportId, slotIndex);
    if (!r?.endsAt) return null;
    const diff = Math.floor((r.endsAt - nowMs) / 1000);
    return Math.max(0, diff);
  }

  function isFinished(transportId, slotIndex, nowMs = Date.now()) {
    const r = getSlotRoute(transportId, slotIndex);
    if (!r?.endsAt) return false;
    return nowMs >= r.endsAt;
  }

  function ensureAssigned(transportId, slotIndex) {
    if (!transportId) return { ok: false, reason: '운송수단이 선택되지 않았습니다.' };
    if (slotIndex < 1 || slotIndex > 3) return { ok: false, reason: '유효하지 않은 슬롯입니다.' };

    const t = ensureTransportState(transportId);
    const key = String(slotIndex);
    const current = t.slots?.[key] || null;

    if (current?.routeId) return { ok: true, assigned: false, route: current };

    const pool = getRoutePoolByTransport(transportId);
    const picked = pickRandom(pool);
    if (!picked) return { ok: false, reason: '노선 풀(데이터)이 비어 있습니다.' };

    t.slots[key] = buildAssignedRoute(picked);
    safeSave(state);

    return { ok: true, assigned: true, route: t.slots[key] };
  }

  function canReroll(transportId, slotIndex, opts = {}) {
    const { redistributionUnlocked = false, isOwned = true } = opts;

    if (!transportId) return { ok: false, reason: '운송수단이 선택되지 않았습니다.' };
    if (slotIndex < 1 || slotIndex > 3) return { ok: false, reason: '유효하지 않은 슬롯입니다.' };
    if (!isOwned) return { ok: false, reason: '먼저 해당 슬롯을 구매하세요.' };

    const current = getSlotRoute(transportId, slotIndex);
    if (!current?.routeId) return { ok: true, reason: '' };

    if (!redistributionUnlocked) {
      return { ok: false, reason: '노선은 고정입니다. “프리뷰 노선 재분배” 연구가 필요합니다.' };
    }
    return { ok: true, reason: '' };
  }

  function reroll(transportId, slotIndex, opts = {}) {
    const gate = canReroll(transportId, slotIndex, opts);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    const t = ensureTransportState(transportId);
    const key = String(slotIndex);

    const pool = getRoutePoolByTransport(transportId);
    if (!pool.length) return { ok: false, reason: '노선 풀(데이터)이 비어 있습니다.' };

    const current = t.slots?.[key] || null;
    let picked = pickRandom(pool);

    if (current?.routeId && pool.length > 1) {
      let guard = 0;
      while (picked && picked.id === current.routeId && guard < 10) {
        picked = pickRandom(pool);
        guard += 1;
      }
    }

    if (!picked) return { ok: false, reason: '노선 선택 실패' };

    t.slots[key] = buildAssignedRoute(picked);
    safeSave(state);

    return { ok: true, route: t.slots[key] };
  }

  /**
   * ✅ 자동 재시작(자동배정)
   * policy:
   * - same_route: 기존 노선 유지하고 "시간만 새로 랜덤 배정"
   * - reroll_route: 노선 자체도 다시 랜덤(=롤링)
   */
  function restartRun(transportId, slotIndex, policy = 'same_route', nowMs = Date.now()) {
    if (!transportId) return { ok: false, reason: '운송수단이 선택되지 않았습니다.' };
    if (slotIndex < 1 || slotIndex > 3) return { ok: false, reason: '유효하지 않은 슬롯입니다.' };

    const t = ensureTransportState(transportId);
    const key = String(slotIndex);
    const current = t.slots?.[key] || null;

    if (!current?.routeId) return { ok: false, reason: '노선이 배정되지 않았습니다.' };

    // 중복 재시작 방지(동일 tick에 여러 번 호출될 수 있음)
    if (current.lastAutoRestartAt && nowMs - current.lastAutoRestartAt < 500) {
      return { ok: true, restarted: false, route: current };
    }

    const pool = getRoutePoolByTransport(transportId);

    let routeDef = null;

    if (policy === 'reroll_route') {
      routeDef = pickRandom(pool);
    } else {
      // same_route: 현재 노선 ID 기반으로 def 찾기
      routeDef = pool.find((p) => p.id === current.routeId) || pool[0] || null;
    }

    if (!routeDef) return { ok: false, reason: '노선 정의를 찾을 수 없습니다.' };

    const next = buildAssignedRoute(routeDef, nowMs);
    next.lastAutoRestartAt = nowMs;

    t.slots[key] = next;
    safeSave(state);

    return { ok: true, restarted: true, route: next };
  }

  function resetSlot(transportId, slotIndex) {
    const t = ensureTransportState(transportId);
    if (!t) return;
    t.slots[String(slotIndex)] = null;
    safeSave(state);
  }

  return {
    getSlotRoute,
    getRemainingSec,
    isFinished,
    ensureAssigned,
    canReroll,
    reroll,
    restartRun,
    resetSlot,
  };
}
