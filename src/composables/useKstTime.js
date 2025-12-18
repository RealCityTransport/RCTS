// src/composables/useKstTime.js

import { ref, onMounted, onUnmounted } from 'vue';

export function useKstTime() {
  const kstString = ref('');
  let timer = null;

  // 두 자리 숫자 맞추기 헬퍼 함수
  const pad2 = (num) => String(num).padStart(2, '0');

  // KST 시간 포맷팅 함수
  const formatKST = (date) => {
    // en-US 로케일에서 Asia/Seoul 타임존으로 변환하여 KST를 얻음
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const Y = d.getFullYear();
    const M = pad2(d.getMonth() + 1);
    const D = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    // 초는 표시하지 않습니다.
    return `${Y}. ${M}. ${D}. ${hh}:${mm}`;
  };

  // 컴포넌트 마운트 시 시간 업데이트 시작
  onMounted(() => {
    // 초기값 설정
    kstString.value = formatKST(new Date());
    // 1분(60초)마다 업데이트 (분까지만 표시하므로 굳이 1초마다 할 필요 없음)
    // 그러나 UX상 초 단위가 갱신되는 것이 자연스러울 수도 있어 1초를 유지
    timer = setInterval(() => {
      kstString.value = formatKST(new Date());
    }, 1000); // 1초 (1000ms)마다 업데이트
  });

  // 컴포넌트 언마운트 시 타이머 정리
  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer);
    }
  });

  // 외부에서 kstString 값을 사용할 수 있도록 반환
  return { kstString };
}