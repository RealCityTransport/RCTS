// src/composables/usePreviewPurchase.js
import { reactive, computed } from 'vue';

/**
 * 프리뷰 구매 상태(로컬 저장)
 * - transportId 단위로 슬롯 구매 상태를 관리
 * - 예: state.byTransport['bus'] = { slots: [true,false,false] }
 */
const STORAGE_KEY = 'rcts_preview_purchase_v1';

function loadState() {
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

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 치명적이지 않으므로 무시(필요하면 토스트 처리)
  }
}

/**
 * 슬롯 가격 정책
 * - slotIndex: 1..3
 * - basePrice: 기본 차량 가격(예: 버스 1.6억)
 */
function calcPrice(slotIndex, basePrice) {
  if (slotIndex === 1) return 0;
  if (slotIndex === 2) return Math.floor(basePrice * 0.5);
  if (slotIndex === 3) return Math.floor(basePrice * 1.0);
  return null;
}

// 전역 싱글톤 상태
const state = reactive(loadState());

export function usePreviewPurchase() {
  function ensureTransport(transportId) {
    if (!transportId) return null;
    if (!state.byTransport[transportId]) {
      state.byTransport[transportId] = { slots: [false, false, false] };
      saveState(state);
    }
    return state.byTransport[transportId];
  }

  function isOwned(transportId, slotIndex) {
    const t = ensureTransport(transportId);
    if (!t) return false;
    return !!t.slots?.[slotIndex - 1];
  }

  function ownedCount(transportId) {
    const t = ensureTransport(transportId);
    if (!t) return 0;
    return (t.slots || []).filter(Boolean).length;
  }

  /**
   * 구매 가능 조건
   * - 슬롯1: 언제든(프리뷰 오픈 상태에서)
   * - 슬롯2: 슬롯1 구매 후
   * - 슬롯3: 슬롯2 구매 후
   */
  function canBuySlot(transportId, slotIndex) {
    if (!transportId) return { ok: false, reason: '운송수단이 선택되지 않았습니다.' };
    if (slotIndex < 1 || slotIndex > 3) return { ok: false, reason: '유효하지 않은 슬롯입니다.' };
    if (isOwned(transportId, slotIndex)) return { ok: false, reason: '이미 구매한 슬롯입니다.' };

    if (slotIndex === 1) return { ok: true };
    if (slotIndex === 2 && !isOwned(transportId, 1))
      return { ok: false, reason: 'SLOT 1 구매 후 SLOT 2가 열립니다.' };
    if (slotIndex === 3 && !isOwned(transportId, 2))
      return { ok: false, reason: 'SLOT 2 구매 후 SLOT 3가 열립니다.' };

    return { ok: true };
  }

  /**
   * 구매 처리
   * @param {string} transportId
   * @param {number} slotIndex 1..3
   * @param {number} basePrice 기본차량 가격
   * @param {{ canSpend:(amount:number)=>boolean, spend:(amount:number)=>void }} finance
   */
  function buySlot(transportId, slotIndex, basePrice, finance) {
    const gate = canBuySlot(transportId, slotIndex);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    const price = calcPrice(slotIndex, basePrice);
    if (price == null) return { ok: false, reason: '가격 계산 실패' };

    // 자금 체크/차감(0원은 패스)
    if (price > 0) {
      if (!finance?.canSpend?.(price)) {
        return { ok: false, reason: '잔액이 부족합니다.' };
      }
      finance.spend(price);
    }

    // 상태 업데이트
    const t = ensureTransport(transportId);
    t.slots[slotIndex - 1] = true;
    saveState(state);

    return { ok: true, pricePaid: price };
  }

  /**
   * 슬롯별 가격(표시용)
   */
  function getSlotPrice(slotIndex, basePrice) {
    return calcPrice(slotIndex, basePrice);
  }

  return {
    // state accessors
    isOwned,
    ownedCount,

    // pricing
    getSlotPrice,

    // gates + actions
    canBuySlot,
    buySlot,
  };
}
