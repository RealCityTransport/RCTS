// src/script/HomeView.js
// HomeView.vue 컴포넌트의 script setup 로직을 담고 있습니다.
// 현재 HomeView.vue에는 전역 레이아웃 관리 로직 외에는 구체적인 데이터나 기능이 없습니다.
// 필요에 따라 여기에 로직을 추가할 수 있습니다.

import { ref, onMounted, onUnmounted, computed } from 'vue';

// 예시: 반응형 패널 토글 로직 등, 이 컴포넌트에 필요한 로직을 여기에 정의할 수 있습니다.
// 하지만 현재 HomeView.vue는 단순한 컨테이너 역할이므로, 비워두는 것이 적절합니다.

// 각 영역 컴포넌트들을 불러옵니다.
import TheTopBar from '@/components/TheTopBar.vue';
import TheLeftArea from '@/components/TheLeftArea.vue';
import TheCenterArea from '@/components/TheCenterArea.vue';
import TheRightArea from '@/components/TheRightArea.vue';

// script setup src를 사용하기 때문에, 이 파일에서 import된 컴포넌트들은
// 자동으로 HomeView.vue의 템플릿에서 사용할 수 있게 됩니다.
// (여기서는 TheTopBar 등 컴포넌트들을 이미 HomeView.vue의 템플릿에서 직접 사용하고 있습니다.)