// src/composables/useVehicles.js
import { ref } from 'vue';

// ✨ 현재 선택된 운송 수단 ID (전역 상태)
// 이 값은 TheLeftArea에서 사용자가 운송 수단 항목을 클릭할 때 업데이트됩니다.
const selectedTransportId = ref(null);

export function useVehicles() {
  const setSelectedTransportId = (id) => {
    selectedTransportId.value = id;
  };

  return {
    selectedTransportId,
    setSelectedTransportId,
    // 여기에 나중에 차량 목록, 관리 기능 등이 추가될 예정입니다.
  };
}