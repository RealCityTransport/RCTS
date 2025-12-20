<!-- src/views/ResearchView.vue -->
 <template>
   <div class="research-page-container">
     <h2 class="page-title">🚀 연구실 🚀</h2>
     <p class="page-description">
       새로운 기술을 연구하여 운송 제국을 확장하고 발전시키세요!
     </p>
 
     <!-- 해금할 운송 수단이 있을 경우에만 이 블록을 띄웁니다. -->
     <div v-if="lockedTransports.length > 0" class="research-list-wrapper">
       <h3 class="research-section-title">✨ 연구 가능한 운송 수단 ✨</h3>
       <p class="research-section-description">
         어떤 운송 수단을 먼저 연구하여 도시를 발전시킬까요? (선택 가능: {{ lockedTransports.length }}개)
       </p>
       <div class="research-items">
         <div 
           v-for="transport in lockedTransports" 
           :key="transport.id" 
           class="research-item-card"
           :class="{ 'researching': transport.isResearching }"
         >
           <span class="item-icon">{{ transport.icon }}</span>
           <h4 class="item-name">{{ transport.name }}</h4>

           <!-- 🔥 상태에 따라 표시되는 영역은 이 div 하나만 렌더링되도록 수정합니다. 🔥 -->
           <div class="research-status-area">
             <template v-if="transport.isResearching">
               <!-- 🔥🔥🔥 ProgressBar 컴포넌트 사용 🔥🔥🔥 -->
               <ProgressBar
                 :percentage="getResearchProgress(transport.id)"
                 :display-text="getResearchRemainingTime(transport.id)"
                 theme="positive"
               />
               <button class="unlock-item-btn researching" disabled>연구 중...</button>
             </template>
             <template v-else>
               <button class="unlock-item-btn" @click="unlockSpecificTransport(transport.id)">해금 연구 시작</button>
             </template>
           </div>
         </div>
       </div>
     </div>
   </div>
 </template>

 <script setup>
 import { computed } from 'vue';
 import { useResearch } from '@/composables/useResearch';
 import ProgressBar from '@/components/ProgressBar.vue';
 
 const {
   transportTypes,
   unlockTransport,
   getLockedTransports,
   getResearchProgress,
   getResearchRemainingTime,
   currentTime // 🔥 컴포넌트가 currentTime에 의존하도록 추가 (반응형 업데이트를 위함)
 } = useResearch();
 
 const lockedTransports = computed(() => {
   // 🔥 currentTime.value에 의존하여 매초 업데이트되도록 강제합니다.
   // (getLockedTransports 내부에서는 transportTypes.value에만 의존하므로 직접 여기에 추가)
   // eslint-disable-next-line no-unused-vars
   const triggerUpdate = currentTime.value;
   return getLockedTransports();
 });
 
 const unlockSpecificTransport = (transportId) => {
   // console.log(`ResearchView: '${transportId}' 해금 연구 시작 버튼 클릭됨!`); // 콘솔 메시지 제거
   const success = unlockTransport(transportId);
 };
 </script>

<style scoped lang="scss">
@use '@/styles/ResearchView.scss';
</style>