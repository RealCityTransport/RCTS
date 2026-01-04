<!-- src/components/play/PlayControlDisplay.vue -->
<template>
  <div class="control-display">
    <div class="control-display-header">
      <p class="control-display-title">관제 화면</p>
      <p class="control-display-subtitle">
        이 영역 전체가 관제용 OSM 지형이 표시될 공간입니다.
      </p>
    </div>

    <div class="control-display-body">
      <div class="map-viewport" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L, {
  Map as LeafletMap,
  Marker as LeafletMarker,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { usePlayerAccount } from '@/composables/usePlayerAccount'

const mapContainer = ref<HTMLElement | null>(null)
const mapInstance = ref<LeafletMap | null>(null)
const markerInstance = ref<LeafletMarker | null>(null)

const { company } = usePlayerAccount()

// 기본 중심: 서울
const defaultCenter: [number, number] = [37.5665, 126.978]

// 최대 줌 19 기준
// "18보다 2단 멀리" → 16에 고정
const tileMaxZoom = 19
const fixedZoom = 16

function applyCenterFromCompany() {
  if (!mapInstance.value) return

  // 타입 단언: 여기까지 왔으면 null 아님을 보장
  const map = mapInstance.value as LeafletMap

  const lat = company.value?.hqLat
  const lng = company.value?.hqLng

  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    const center: [number, number] = [lat, lng]
    map.setView(center, fixedZoom)

    if (markerInstance.value) {
      markerInstance.value.setLatLng(center)
    } else {
      markerInstance.value = L.marker(center).addTo(map)
    }
  } else {
    map.setView(defaultCenter, fixedZoom)

    if (markerInstance.value) {
      markerInstance.value.setLatLng(defaultCenter)
    } else {
      markerInstance.value = L.marker(defaultCenter).addTo(map)
    }
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  const map = L.map(mapContainer.value, {
    center: defaultCenter,
    zoom: fixedZoom,
    minZoom: fixedZoom,
    maxZoom: fixedZoom,

    zoomControl: false,
    dragging: false,
    keyboard: false,
    boxZoom: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    touchZoom: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: tileMaxZoom,
  }).addTo(map)

  const marker = L.marker(defaultCenter).addTo(map)

  mapInstance.value = map
  markerInstance.value = marker

  applyCenterFromCompany()
})

watch(
  () => [company.value?.hqLat, company.value?.hqLng],
  () => {
    applyCenterFromCompany()
  }
)

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
  markerInstance.value = null
})
</script>

<style scoped>
.control-display {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 55%),
    #05060a;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.02);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}

.control-display-header {
  margin-bottom: 12px;
}

.control-display-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.control-display-subtitle {
  font-size: 0.78rem;
  opacity: 0.7;
  line-height: 1.6;
}

.control-display-body {
  flex: 1;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  padding: 0;
  overflow: hidden;
}

.map-viewport {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}
</style>
