<!-- src/components/main/MainMapPage.vue -->
<template>
  <section class="map-page">
    <header class="map-header">
      <div class="map-header-left">
        <h2 class="map-title">RCTS 한국 네트워크 베이스 뷰</h2>
        <p class="map-subtitle">
          이 화면은 한반도 영역(대략 위도 33°~39.5°, 경도 124.5°~132°)에 대응하는 기본 지형 베이스입니다.
          이후 노선 · 정류장 · 차량 시스템을 이 위에 순차적으로 얹어갈 수 있습니다.
        </p>
      </div>

      <div class="map-header-right">
        <!-- 스타일 토글 -->
        <div class="style-toggle">
          <button
            type="button"
            class="style-btn"
            :class="{ active: mapStyle === 'high' }"
            @click="setStyle('high')"
          >
            고품질
          </button>
          <button
            type="button"
            class="style-btn"
            :class="{ active: mapStyle === 'simple' }"
            @click="setStyle('simple')"
          >
            라인형
          </button>
        </div>

        <button
          type="button"
          class="map-btn"
          @click="resetView"
        >
          초기 위치로
        </button>
      </div>
    </header>

    <div class="map-body">
      <div
        ref="mapContainer"
        class="map-stage"
        :class="mapStyleClass"
      ></div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineOptions({
  name: 'MainMapPage',
})

const mapContainer = ref(null)
let mapInstance = null

/**
 * 스타일 모드:
 *  - 'high'   : 기본 컬러 타일
 *  - 'simple' : 흑백/라인형 느낌의 최소 표현
 */
const mapStyle = ref('high')

function setStyle(style) {
  mapStyle.value = style
}

const mapStyleClass = computed(() =>
  mapStyle.value === 'simple' ? 'map-stage-simple' : 'map-stage-high',
)

/**
 * 한반도 대략 경계:
 *  남서: (33.0, 124.5)
 *  북동: (39.5, 132.0)
 */
const KOREA_BOUNDS = L.latLngBounds(
  [33.0, 124.5],
  [39.5, 132.0],
)

const KOREA_CENTER = [36.5, 127.8]
const INITIAL_ZOOM = 7
const MIN_ZOOM = 5
const MAX_ZOOM = 18

onMounted(() => {
  if (!mapContainer.value) return

  mapInstance = L.map(mapContainer.value, {
    center: KOREA_CENTER,
    zoom: INITIAL_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    maxBounds: KOREA_BOUNDS,
    maxBoundsViscosity: 0.8,
    worldCopyJump: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(mapInstance)
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

function resetView() {
  if (!mapInstance) return
  mapInstance.setView(KOREA_CENTER, INITIAL_ZOOM)
}
</script>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.map-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.map-title {
  font-size: 0.98rem;
  font-weight: 700;
}

.map-subtitle {
  font-size: 0.78rem;
  opacity: 0.85;
}

.map-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
}

/* 스타일 토글 버튼 */

.style-toggle {
  display: inline-flex;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.style-btn {
  padding: 3px 10px;
  font-size: 0.74rem;
  background: rgba(15, 23, 42, 0.9);
  color: #cbd5f5;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.style-btn + .style-btn {
  border-left: 1px solid rgba(148, 163, 184, 0.6);
}

.style-btn.active {
  background: #e5e7eb;
  color: #0f172a;
}

/* 본문 컨테이너 */

.map-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* Leaflet 컨테이너 */

.map-stage {
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  overflow: hidden;
}

/* 고품질: 컬러 + 약간의 배경 */

.map-stage-high {
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.8), #020617);
}

/* 라인형: 흑백 느낌으로 필터링 */

.map-stage-simple :deep(.leaflet-layer) {
  filter: grayscale(1) contrast(1.1);
}
</style>
