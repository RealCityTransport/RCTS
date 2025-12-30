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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineOptions({
  name: 'MainMapPage',
})

const mapContainer = ref(null)
let mapInstance = null
let roadsLayerGroup = null
let baseTileLayerHigh = null // 고품질에서만 쓰는 OSM 타일 레이어

/**
 * 스타일 모드:
 *  - 'high'   : OSM 타일 + 디테일 (좀 무거움)
 *  - 'simple' : 타일 없이 우리 레이어만 (가볍게)
 *
 * 기본값을 'simple'로 두면 첫 로딩이 훨씬 가벼워짐.
 */
const mapStyle = ref('simple')

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

// 기본 카메라는 한국 전체보다 살짝 줌인한 위치
const KOREA_CENTER = [36.5, 127.8]
const INITIAL_ZOOM = 7
const MIN_ZOOM = 5
const MAX_ZOOM = 18

/**
 * RCTS 도로 모델에서 가져온 한국 샘플 도로 1호
 * (현재는 DB → 쿼리 결과를 그대로 하드코딩한 상태)
 */
const sampleRoads = [
  {
    id: 1,
    funcClass: 'primary',
    grade: 'surface',
    name: '테스트로',
    from: [37.5665, 126.978], // 서울 시청 근처
    to: [37.565, 126.985], // 살짝 남동쪽
  },
]

function createBaseMap() {
  if (!mapContainer.value) return

  mapInstance = L.map(mapContainer.value, {
    center: KOREA_CENTER,
    zoom: INITIAL_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    maxBounds: KOREA_BOUNDS,
    maxBoundsViscosity: 0.8,
    worldCopyJump: false,
    preferCanvas: true, // SVG 대신 Canvas 우선 사용 → 많은 라인/마커에 유리
    updateWhenIdle: true, // 이동 끝났을 때만 다시 그리기
  })

  // 기본 도로/노선 레이어 그룹
  roadsLayerGroup = L.layerGroup().addTo(mapInstance)

  // 현재 스타일에 맞게 베이스 타일 적용
  applyBaseTileLayer(mapStyle.value)

  // 샘플 도로 그리기
  drawSampleRoads()
}

/**
 * 스타일에 따라 베이스 타일 레이어 추가/제거
 * - simple : 타일 없음 (우리 레이어만 그림 → 가장 가벼움)
 * - high   : OSM 타일 레이어 추가
 */
function applyBaseTileLayer(style) {
  if (!mapInstance) return

  if (style === 'high') {
    if (!baseTileLayerHigh) {
      baseTileLayerHigh = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
          updateWhenIdle: true,
          keepBuffer: 1, // 주변 타일 1타일만 유지 (메모리 절약)
        },
      )
    }
    if (!mapInstance.hasLayer(baseTileLayerHigh)) {
      baseTileLayerHigh.addTo(mapInstance)
    }
  } else {
    // simple 모드: 타일 제거 → 배경은 CSS 그라디언트 + 우리 라인만
    if (baseTileLayerHigh && mapInstance.hasLayer(baseTileLayerHigh)) {
      mapInstance.removeLayer(baseTileLayerHigh)
    }
  }
}

/**
 * funcClass / grade에 따라 스타일을 달리 주는 간단한 규칙
 */
function getRoadStyle(road) {
  let weight = 2.5
  if (road.funcClass === 'motorway') {
    weight = 6
  } else if (road.funcClass === 'trunk') {
    weight = 5
  } else if (road.funcClass === 'primary') {
    weight = 4
  } else if (road.funcClass === 'secondary') {
    weight = 3.2
  }

  const dashArray = road.grade === 'tunnel' ? '6, 6' : null

  const color =
    road.grade === 'elevated'
      ? '#60a5fa' // 고가(푸른 계열)
      : road.grade === 'tunnel'
        ? '#f97316' // 터널(주황 계열)
        : '#4ade80' // 지상(연두 계열)

  return {
    weight,
    opacity: 0.95,
    dashArray,
    color,
  }
}

/**
 * 샘플 도로들을 Leaflet Layer로 그리기
 */
function drawSampleRoads() {
  if (!mapInstance || !roadsLayerGroup) return

  roadsLayerGroup.clearLayers()

  sampleRoads.forEach((road) => {
    const latlngs = [road.from, road.to]
    const style = getRoadStyle(road)

    const polyline = L.polyline(latlngs, style).addTo(roadsLayerGroup)

    if (road.name || road.id != null) {
      polyline.bindTooltip(road.name || `link #${road.id}`, {
        permanent: false,
        direction: 'top',
        offset: [0, -4],
      })
    }
  })

  // 도로가 바로 보이도록 한번 맞춰줌 (첫 로딩 체감용)
  if (sampleRoads.length > 0) {
    const all = sampleRoads.flatMap((r) => [r.from, r.to])
    mapInstance.fitBounds(all, { padding: [40, 40] })
  }
}

onMounted(() => {
  createBaseMap()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    roadsLayerGroup = null
    baseTileLayerHigh = null
  }
})

function resetView() {
  if (!mapInstance) return
  mapInstance.setView(KOREA_CENTER, INITIAL_ZOOM)
}

/**
 * 스타일 토글 시:
 *  - 베이스 타일만 토글
 *  - 도로 레이어는 그대로 유지
 */
watch(mapStyle, (newStyle) => {
  applyBaseTileLayer(newStyle)
})
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

/* 라인형: 완전 미니멀, 우리 라인만 강조 */

.map-stage-simple {
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.9), #020617);
}

/* 혹시 타일이 살아있을 때 simple 모드로 내려오면 흑백 필터 추가 가능
.map-stage-simple :deep(.leaflet-layer) {
  filter: grayscale(1) contrast(1.1);
}
*/
</style>
