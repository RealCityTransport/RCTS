 <!-- src/components/TheLeftArea.vue -->
 <template>
   <div class="layout-area left-area">
     <div class="left-panel-wrapper">
       <!-- 🔥🔥🔥 1. 운송 수단 목록을 상단으로 올립니다. 🔥🔥🔥 -->
       <div class="transport-list-container">
         <h3 class="panel-heading">🚚 운송 수단 🚚</h3>
         <ul class="transport-list">
           <li 
             v-for="transport in getUnlockedTransports()" 
             :key="transport.id" 
             class="transport-item"
             :class="{ active: selectedTransportId === transport.id }"
             @click="setSelectedTransportId(transport.id)"
           >
             <span class="transport-icon">{{ transport.icon }}</span>
             <span class="transport-name">{{ transport.name }}</span>
             <span class="transport-count">0대</span> <!-- 임시 차량 수 -->
           </li>
         </ul>
       </div>

       <!-- 🔥🔥🔥 2. 클릭된 운송 수단의 상세 정보 표시 영역을 추가합니다. 🔥🔥🔥 -->
       <div v-if="selectedTransport" class="transport-details-container">
         <h3 class="panel-heading">{{ selectedTransport.name }} 상세 정보</h3>
         <div class="details-content">
           <p><strong>아이콘:</strong> {{ selectedTransport.icon }}</p>
           <p><strong>종류:</strong> {{ selectedTransport.name }}</p>
           <p><strong>총 보유 차량:</strong> 0대</p>
           <p><strong>연구 완료 여부:</strong> {{ selectedTransport.locked ? '아니오' : '예' }}</p>
           <!-- 여기에 더 상세한 차량 정보가 추가될 예정입니다. -->
           <p class="details-placeholder">선택된 {{ selectedTransport.name }}의 운영 통계 및 관리 옵션이 이곳에 표시됩니다.</p>
         </div>
       </div>
       <div v-else class="transport-details-placeholder">
          <p class="placeholder-text">운송 수단을 선택하여 상세 정보를 확인하세요.</p>
       </div>

       <!-- 🔥🔥🔥 3. 보유 자원 목록을 하단으로 내립니다. 🔥🔥🔥 -->
       <div class="resource-container">
         <h3 class="panel-heading">📦 보유 자원 📦</h3>
         <p>현금: $10,000</p>
       </div>
     </div>
   </div>
 </template>
 
 <script setup>
 import { computed } from 'vue';
 import { useResearch } from '@/composables/useResearch';
 import { useVehicles } from '@/composables/useVehicles'; // 🔥 useVehicles 임포트
 
 const { getUnlockedTransports, transportTypes } = useResearch(); // 🔥 transportTypes도 가져옵니다.
 const { selectedTransportId, setSelectedTransportId } = useVehicles(); // 🔥 useVehicles 활용

 // ✨ 현재 선택된 운송 수단의 상세 정보를 계산하는 computed 속성
 const selectedTransport = computed(() => {
   if (selectedTransportId.value) {
     return transportTypes.value.find(t => t.id === selectedTransportId.value);
   }
   return null;
 });
 </script>
 
 <style scoped lang="scss">
 @use '../styles/TheLeftArea.scss';
 </style>