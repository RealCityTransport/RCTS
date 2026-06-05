<!--
  파일명: src/views/VehiclesView.vue

  역할:
  - 차량 구입 화면입니다.
  - 연구 완료 차량은 위쪽에 가격 낮은 순으로 표시합니다.
  - 연구가 필요한 차량은 아래쪽에 잠김 상태로 표시합니다.
  - 버스 차량은 정류장/광역 이동 구조와 정원을 함께 표시합니다.
-->

<template>
  <section class="vehicles-page">
    <div class="vehicle-list">
      <article
        v-for="vehicle in vehicleListForView"
        :key="vehicle.type"
        class="vehicle-card"
        :class="{ locked: !isVehicleUnlocked(vehicle) }"
      >
        <div class="vehicle-left">
          <div class="vehicle-icon">
            {{ vehicle.icon }}
          </div>

          <div class="vehicle-main">
            <div class="vehicle-title-row">
              <h3>{{ vehicle.name }}</h3>

              <span class="owned-badge">
                보유 {{ getOwnedVehicleCount(vehicle.type) }}대
              </span>
            </div>

            <p>{{ vehicle.description }}</p>

            <div class="vehicle-meta">
              <div>
                <span>운영방식</span>
                <strong>{{ getVehicleDurationText(vehicle) }}</strong>
              </div>

              <div>
                <span>가격</span>
                <strong>{{ getVehiclePriceText(vehicle) }}</strong>
              </div>

              <div>
                <span>슬롯</span>
                <strong>{{ currentOperationSlotCount }} / {{ operationSlotLimitText }}</strong>
              </div>

              <div
                v-if="isBusVehicle(vehicle)"
                class="bus-capacity-meta"
              >
                <span>정원</span>
                <strong>{{ vehicle.capacity ?? 0 }}인승</strong>
              </div>
            </div>
          </div>
        </div>

        <button
          class="buy-button"
          :disabled="!canBuyVehicle(vehicle)"
          @click="buyVehicle(vehicle.type)"
        >
          {{ getVehicleButtonText(vehicle) }}
        </button>
      </article>
    </div>
  </section>
</template>

<script setup>
import {
  buyVehicle,
  canBuyVehicle,
  currentOperationSlotCount,
  formatRemainTime,
  getOwnedVehicleCount,
  getVehicleButtonText,
  getVehiclePriceText,
  isVehicleUnlocked,
  operationSlotLimitText,
  vehicleListForView,
} from '../stores/gameStore'

const isBusVehicle = (vehicle) => {
  return vehicle.category === '버스' || vehicle.durationMode === 'bus_stops' || vehicle.durationMode === 'bus_metro'
}

const getVehicleDurationText = (vehicle) => {
  if (vehicle.durationMode === 'random') {
    return `${formatRemainTime(vehicle.minDurationSeconds)}~${formatRemainTime(vehicle.maxDurationSeconds)}`
  }

  if (vehicle.durationMode === 'parcel_count') {
    return `${vehicle.minParcelCount}~${vehicle.maxParcelCount}건`
  }

  if (vehicle.durationMode === 'bus_stops') {
    return `${formatRemainTime(vehicle.durationSeconds)} / ${vehicle.stopCount ?? 0}정류장`
  }

  if (vehicle.durationMode === 'bus_metro') {
    return `출발 ${vehicle.startStops ?? 0} + 이동 ${formatRemainTime(vehicle.expressMoveSeconds ?? 0)} + 종착 ${vehicle.endStops ?? 0}`
  }

  return formatRemainTime(vehicle.durationSeconds)
}
</script>

<style scoped>
.vehicles-page {
  display: grid;
  gap: 10px;
}

.vehicle-list {
  display: grid;
  gap: 10px;
}

.vehicle-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #dce6f2;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(24, 54, 94, 0.055);
}

.vehicle-card.locked {
  opacity: 0.72;
  background: rgba(246, 249, 252, 0.92);
}

.vehicle-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.vehicle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eef5ff;
  font-size: 27px;
}

.vehicle-card.locked .vehicle-icon {
  filter: grayscale(1);
}

.vehicle-main {
  display: grid;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.vehicle-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.vehicle-title-row h3 {
  min-width: 0;
  margin: 0;
  color: #142033;
  font-size: 17px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.owned-badge {
  flex: 0 0 auto;
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #607086;
  font-size: 11px;
  font-weight: 900;
}

.vehicle-main p {
  margin: 0;
  color: #607086;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vehicle-meta {
  display: grid;
  grid-template-columns: 150px 106px 90px 78px;
  gap: 8px;
}

.vehicle-meta div {
  min-width: 0;
  padding: 7px 9px;
  border-radius: 12px;
  background: #f5f8fc;
}

.vehicle-meta span {
  display: block;
  color: #7b8ba0;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.vehicle-meta strong {
  display: block;
  margin-top: 4px;
  color: #142033;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bus-capacity-meta strong {
  color: #1677ff;
}

.buy-button {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 15px;
  background: #1677ff;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}

.buy-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(22, 119, 255, 0.2);
}

.buy-button:disabled {
  background: #c8d2df;
  cursor: default;
  transform: none;
  box-shadow: none;
}

@media (min-width: 1024px) {
  .vehicle-card {
    grid-template-columns: minmax(0, 1fr) 132px;
    padding: 14px 16px;
  }

  .vehicle-meta {
    grid-template-columns: 190px 128px 110px 90px;
  }
}

@media (max-width: 760px) {
  .vehicle-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .vehicle-card {
    grid-template-columns: 1fr;
  }

  .vehicle-left {
    align-items: flex-start;
  }
}

@media (max-width: 420px) {
  .vehicle-title-row {
    flex-wrap: wrap;
  }

  .vehicle-main p {
    white-space: normal;
  }
}
</style>