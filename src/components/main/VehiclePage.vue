<!--
RCTS FILE CONTEXT
파일 역할:
- 차량 메뉴의 기본 페이지.
- 차량은 버스, 철도, 비행기, 선박, 우주선 등 모든 운송 수단의 생산/보유/관리를 담당한다.
- 현재는 기본 버스 차량을 추가할 수 있다.

현재 연결:
- Home.vue에서 activeMenu === 'vehicle'일 때 표시된다.
- vehicles props를 받는다.
- add-vehicle 이벤트로 Home.vue에 차량 추가 요청을 전달한다.
- BaseMainPage.vue를 사용해 메인 페이지 포맷을 통일한다.

현재 규칙:
- 차량 메뉴는 vehicle-basic 연구 완료 후 좌측 메뉴에서 클릭 가능해진다.
- 현재 실제 추가 가능한 차량은 중형버스 1종이다.
- 중형버스 기본 정원은 25명이다.
- 중형버스 기본 최고속도는 100km/h다.
- 추가된 차량은 Home.vue의 vehicles 배열에 저장된다.
- 차량 상태는 대기중, 배차됨, 운행중으로 표시된다.
- 수동 저장 시 IndexedDB에 vehicles도 함께 저장된다.
-->

<template>
  <BaseMainPage
    eyebrow="VEHICLE"
    title="차량"
    description="버스, 철도, 비행기, 선박, 우주선 등 모든 교통수단의 생산과 보유 차량 관리를 담당하는 공간입니다."
    badge="기초 메뉴"
  >
    <section class="vehicle-page-shell">
      <section class="notice-box">
        <strong>차량은 실제 운행에 투입될 이동 수단입니다.</strong>
        <p>
          현재는 기초 버스 차량만 추가할 수 있습니다.
          추가된 차량은 월드 데이터로 저장되고, 운행 메뉴에서 노선 배차에 사용됩니다.
        </p>
      </section>

      <section class="vehicle-grid">
        <article class="vehicle-create-card active">
          <div>
            <span>BUS BASIC</span>
            <strong>중형버스</strong>
            <p>
              초반 운행에 사용할 수 있는 기본 버스입니다.
              정원 25명, 최고속도 100km/h 기준으로 생성됩니다.
            </p>
          </div>

          <dl>
            <div>
              <dt>교통수단</dt>
              <dd>버스</dd>
            </div>

            <div>
              <dt>정원</dt>
              <dd>25명</dd>
            </div>

            <div>
              <dt>속도</dt>
              <dd>100km/h</dd>
            </div>
          </dl>

          <button type="button" @click="addBasicBus">
            중형버스 추가
          </button>
        </article>

        <article class="vehicle-create-card locked">
          <div>
            <span>RAIL</span>
            <strong>철도 차량</strong>
            <p>철도 차량 생산과 편성 기능은 이후 연구로 연결됩니다.</p>
          </div>

          <button type="button" disabled>
            미개발
          </button>
        </article>

        <article class="vehicle-create-card locked">
          <div>
            <span>AIR</span>
            <strong>항공기</strong>
            <p>항공기 생산과 보유 기능은 이후 연구로 연결됩니다.</p>
          </div>

          <button type="button" disabled>
            미개발
          </button>
        </article>

        <article class="vehicle-create-card locked">
          <div>
            <span>SHIP</span>
            <strong>선박</strong>
            <p>선박 생산과 보유 기능은 이후 연구로 연결됩니다.</p>
          </div>

          <button type="button" disabled>
            미개발
          </button>
        </article>

        <article class="vehicle-create-card locked">
          <div>
            <span>SPACE</span>
            <strong>우주선</strong>
            <p>우주선은 후반 확장 교통수단으로 이후 연구에서 다룹니다.</p>
          </div>

          <button type="button" disabled>
            미개발
          </button>
        </article>
      </section>

      <section class="registered-list">
        <div class="list-title">
          <div>
            <span>OWNED VEHICLES</span>
            <h3>보유 차량</h3>
          </div>

          <strong>{{ vehicles.length }}대</strong>
        </div>

        <div v-if="vehicles.length" class="owned-grid">
          <article
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            class="owned-card"
          >
            <div class="owned-main">
              <span>{{ vehicle.transportTypeName }}</span>
              <strong>{{ vehicle.name }}</strong>
              <p>{{ vehicle.vehicleTypeName }}</p>
            </div>

            <dl>
              <div>
                <dt>정원</dt>
                <dd>{{ vehicle.capacity }}명</dd>
              </div>

              <div>
                <dt>최고속도</dt>
                <dd>{{ vehicle.maxSpeedKmh }}km/h</dd>
              </div>

              <div>
                <dt>상태</dt>
                <dd>{{ getStatusLabel(vehicle.status) }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div v-else class="empty-box">
          <strong>아직 보유 차량이 없습니다.</strong>
          <span>중형버스를 추가하면 이곳에 차량 데이터가 표시됩니다.</span>
        </div>
      </section>
    </section>
  </BaseMainPage>
</template>

<script setup>
import BaseMainPage from './BaseMainPage.vue'

defineProps({
  vehicles: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['add-vehicle'])

function addBasicBus() {
  emit('add-vehicle', {
    transportTypeId: 'bus',
    transportTypeName: '버스',
    vehicleTypeId: 'bus-medium',
    vehicleTypeName: '중형버스',
    capacity: 25,
    maxSpeedKmh: 50,
  })
}

function getStatusLabel(status) {
  if (status === 'standby') {
    return '대기중'
  }

  if (status === 'assigned') {
    return '배차됨'
  }

  if (status === 'running') {
    return '운행중'
  }

  if (status === 'maintenance') {
    return '정비중'
  }

  return '상태 미확인'
}
</script>

<style scoped>
.vehicle-page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-box {
  padding: 20px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.notice-box strong {
  display: block;
  color: #111827;
  font-size: 20px;
}

.notice-box p {
  max-width: 820px;
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.vehicle-create-card,
.registered-list {
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.vehicle-create-card {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.vehicle-create-card.active {
  border-color: #93c5fd;
  background: #eff6ff;
}

.vehicle-create-card.locked {
  opacity: 0.62;
  filter: grayscale(0.35);
}

.vehicle-create-card span,
.list-title span,
.owned-card span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.vehicle-create-card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 20px;
}

.vehicle-create-card p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

.vehicle-create-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: white;
}

.vehicle-create-card dt,
.owned-card dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.vehicle-create-card dd,
.owned-card dd {
  margin: 5px 0 0;
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.vehicle-create-card button {
  height: 38px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.vehicle-create-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

.list-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.list-title h3 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.list-title strong {
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.owned-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.owned-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.owned-card strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 18px;
}

.owned-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.owned-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.empty-box {
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
}

.empty-box strong {
  color: #111827;
  font-size: 17px;
}

.empty-box span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .vehicle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .owned-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .vehicle-grid {
    grid-template-columns: 1fr;
  }

  .vehicle-create-card dl,
  .owned-card dl {
    grid-template-columns: 1fr;
  }

  .list-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>