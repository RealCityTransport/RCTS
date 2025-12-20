// src/composables/useKstTime.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useKstTime() {
  const kstString = ref('');
  let timer = null;

  const pad2 = (num) => String(num).padStart(2, '0');

  const formatKST = (date) => {
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const Y = d.getFullYear();
    const M = pad2(d.getMonth() + 1);
    const D = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${Y}. ${M}. ${D}. ${hh}:${mm}`;
  };

  onMounted(() => {
    kstString.value = formatKST(new Date());
    timer = setInterval(() => {
      kstString.value = formatKST(new Date());
    }, 1000);
  });

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer);
    }
  });

  return { kstString };
}