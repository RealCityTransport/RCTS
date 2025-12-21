// src/composables/useFinance.js
import { ref, computed } from 'vue';

const STORAGE_KEY = 'rcts_finance_v1';
const cash = ref(loadCash());

function loadCash() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return typeof v === 'number' ? v : 131391000000; // 테스트용: 충분한 금액
  } catch {
    return 131391000000;
  }
}

function saveCash(v) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {}
}

export function useFinance() {
  const cashText = computed(() => cash.value.toLocaleString('ko-KR'));

  function canSpend(amount) {
    return cash.value >= amount;
  }

  function spend(amount) {
    cash.value = Math.max(0, cash.value - amount);
    saveCash(cash.value);
  }

  function add(amount) {
    cash.value += amount;
    saveCash(cash.value);
  }

  return { cash, cashText, canSpend, spend, add };
}
