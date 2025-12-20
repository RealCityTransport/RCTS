// src/composables/useResearch.js
import { ref, onMounted, onUnmounted, watchEffect, computed } from 'vue';

// 💡 애플리케이션 전역에서 단 하나만 존재할 운송 수단 상태
const transportTypes = ref([
  { id: 'bus', name: '버스', icon: '🚌', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
  { id: 'truck', name: '트럭', icon: '🚚', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
  { id: 'railway', name: '철도', icon: '🚄', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
  { id: 'plane', name: '비행기', icon: '✈️', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
  { id: 'ship', name: '배', icon: '🚢', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
  { id: 'space', name: '우주', icon: '🚀', locked: true, isResearching: false, researchFinishTime: null, researchStartTime: null },
]);

// 💡 로컬 스토리지 키
const LS_KEY = 'rcts_unlocked_transports';
const LS_RESEARCH_KEY = 'rcts_in_research';

// 💡 로컬 스토리지 로드/저장 로직이 앱 생애주기 동안 딱 한 번만 실행되도록 하는 플래그
let isResearchStateInitialized = false;
let researchTimerInterval = null;
const currentTime = ref(Date.now());

// 🔥 연구 시작 전 해금된 운송 수단의 수를 계산하는 computed 속성 🔥
const unlockedCount = computed(() => transportTypes.value.filter(t => !t.locked).length);

// 🔥 전역에서 한 번만 호출되는 연구 진행 상태 업데이트 함수 🔥
const checkResearchStatus = () => {
  let updated = false;
  transportTypes.value.forEach(transport => {
    if (transport.isResearching && transport.researchFinishTime && currentTime.value >= transport.researchFinishTime) {
      transport.locked = false;
      transport.isResearching = false;
      transport.researchFinishTime = null;
      transport.researchStartTime = null;
      updated = true;
    }
  });
};

export function useResearch() {
  onMounted(() => {
    if (!researchTimerInterval) {
      researchTimerInterval = setInterval(() => {
        currentTime.value = Date.now();
        checkResearchStatus();
      }, 1000);
    }
  });

  onUnmounted(() => {
    if (researchTimerInterval) {
      clearInterval(researchTimerInterval);
      researchTimerInterval = null;
    }
  });

  if (!isResearchStateInitialized) {
    const loadUnlockedState = () => {
      const savedState = localStorage.getItem(LS_KEY);
      const savedResearchState = localStorage.getItem(LS_RESEARCH_KEY);
      if (savedState) {
        const unlockedIds = JSON.parse(savedState);
        transportTypes.value.forEach(transport => {
          transport.locked = !unlockedIds.includes(transport.id);
        });
      }

      if (savedResearchState) {
        const inResearch = JSON.parse(savedResearchState);
        transportTypes.value.forEach(transport => {
          const researchData = inResearch.find(r => r.id === transport.id);
          if (researchData) {
            transport.isResearching = researchData.isResearching;
            transport.researchFinishTime = researchData.researchFinishTime;
            transport.researchStartTime = researchData.researchStartTime;
          }
        });
        checkResearchStatus();
      }
    };
    loadUnlockedState();

    let saveTimeout = null;
    watchEffect(() => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const unlockedIds = transportTypes.value
          .filter(t => !t.locked)
          .map(t => t.id);
        localStorage.setItem(LS_KEY, JSON.stringify(unlockedIds));

        const inResearch = transportTypes.value
          .filter(t => t.isResearching)
          .map(t => ({
            id: t.id,
            isResearching: t.isResearching,
            researchFinishTime: t.researchFinishTime,
            researchStartTime: t.researchStartTime
          }));
        localStorage.setItem(LS_RESEARCH_KEY, JSON.stringify(inResearch));
      }, 500);
    });

    isResearchStateInitialized = true;
  }

  const unlockTransport = (transportId) => {
    const transport = transportTypes.value.find(t => t.id === transportId);

    if (transport && transport.locked && !transport.isResearching) {
      transport.isResearching = true;
      transport.researchStartTime = Date.now();

      if (unlockedCount.value === 0) {
        transport.locked = false;
        transport.isResearching = false;
        transport.researchFinishTime = null;
        transport.researchStartTime = null;
      } else {
        const RESEARCH_DURATION_MS = 60 * 60 * 1000; // 1시간 (60분 * 60초 * 1000밀리초)
        transport.researchFinishTime = transport.researchStartTime + RESEARCH_DURATION_MS;
      }
      return true;
    }
    return false;
  };

  const getLockedTransports = () => {
    return transportTypes.value.filter(t => t.locked);
  };

  const getUnlockedTransports = () => {
    return transportTypes.value.filter(t => !t.locked);
  };

  const getResearchProgress = (transportId) => {
    const transport = transportTypes.value.find(t => t.id === transportId);
    if (transport && transport.isResearching && transport.researchStartTime && transport.researchFinishTime && currentTime.value) {
      const totalDuration = transport.researchFinishTime - transport.researchStartTime;
      const elapsed = currentTime.value - transport.researchStartTime;
      
      if (totalDuration <= 0) return 0;

      let progress = (elapsed / totalDuration) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    return 0;
  };

  const getResearchRemainingTime = (transportId) => {
    const transport = transportTypes.value.find(t => t.id === transportId);
    if (transport && transport.isResearching && transport.researchFinishTime && currentTime.value) {
      const remainingMs = transport.researchFinishTime - currentTime.value;
      if (remainingMs <= 0) return '0초 남음';
      const seconds = Math.floor(remainingMs / 1000);
      
      if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours}시간 ${minutes}분 ${remainingSeconds}초 남음`;
      } else if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}분 ${remainingSeconds}초 남음`;
      } else {
        return `${seconds}초 남음`;
      }
    }
    return '';
  };

  return {
    transportTypes,
    unlockTransport,
    getLockedTransports,
    getUnlockedTransports,
    getResearchProgress,
    getResearchRemainingTime,
    currentTime,
  };
}