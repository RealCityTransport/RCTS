<!-- src/components/common/PanZoomSurface.vue -->
<template>
  <div
    class="pz-root"
    ref="rootEl"
    @mousedown="onPointerDown"
    @touchstart.passive="onPointerDown"
    @wheel.prevent="onWheel"
  >
    <div class="pz-layer">
      <!--
        같은 슬롯 콘텐츠를 여러 타일로 복제해서 3×3 격자로 배치.
        worldX / worldY 에 따라 타일 위치만 계속 돌아가도록 함.
      -->
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="pz-tile"
        :style="tile.style"
      >
        <div class="pz-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /** 초기 배율 */
  initialScale: {
    type: Number,
    default: 1,
  },
  minScale: {
    type: Number,
    default: 0.4,
  },
  maxScale: {
    type: Number,
    default: 3,
  },
  /** 휠 스크롤 당 배율 변화 정도 */
  zoomStep: {
    type: Number,
    default: 0.1,
  },

  /** 순환(랩) 기능 */
  enableWrapX: {
    type: Boolean,
    default: false,
  },
  enableWrapY: {
    type: Boolean,
    default: false,
  },

  /**
   * 월드 1칸의 논리적인 너비/높이(px)
   * enableWrapX/Y 가 true일 때 필수.
   * 예: 실제 콘텐츠 레이어가 width: 800px, height: 600px 이면 800, 600
   */
  contentWidth: {
    type: Number,
    default: 0,
  },
  contentHeight: {
    type: Number,
    default: 0,
  },
})

const rootEl = ref(null)

const state = reactive({
  scale: props.initialScale,

  // 화면 상에서의 누적 이동량 (무한대로 쌓임)
  worldX: 0,
  worldY: 0,

  isDragging: false,
  lastX: 0,
  lastY: 0,
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizePointerEvent(e) {
  if (e.touches && e.touches.length > 0) {
    const t = e.touches[0]
    return { x: t.clientX, y: t.clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

function onPointerDown(e) {
  // 왼쪽 버튼 또는 터치만 허용
  if (e.button !== undefined && e.button !== 0) return

  const { x, y } = normalizePointerEvent(e)

  state.isDragging = true
  state.lastX = x
  state.lastY = y

  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('touchend', onPointerUp)
}

function onPointerMove(e) {
  if (!state.isDragging) return

  if (e.cancelable) {
    e.preventDefault()
  }

  const { x, y } = normalizePointerEvent(e)
  const dx = x - state.lastX
  const dy = y - state.lastY

  state.lastX = x
  state.lastY = y

  // 누적 이동량
  state.worldX += dx
  state.worldY += dy
}

function onPointerUp() {
  state.isDragging = false

  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onPointerUp)
}

function onWheel(e) {
  // Ctrl+휠은 브라우저 확대에 맡기고 싶으면 return
  if (e.ctrlKey) return

  const delta = e.deltaY
  const direction = delta > 0 ? -1 : 1
  const nextScale = clamp(
    state.scale + direction * props.zoomStep,
    props.minScale,
    props.maxScale,
  )

  state.scale = nextScale
}

function reset() {
  state.scale = props.initialScale
  state.worldX = 0
  state.worldY = 0
}

/** 더블클릭으로 리셋 */
function onDblClick() {
  reset()
}

onMounted(() => {
  if (rootEl.value) {
    rootEl.value.addEventListener('dblclick', onDblClick)
  }
})

onUnmounted(() => {
  onPointerUp()
  if (rootEl.value) {
    rootEl.value.removeEventListener('dblclick', onDblClick)
  }
})

/**
 * 타일 배열 계산:
 * - 랩이 꺼져 있으면: 1개만 렌더링 (worldX / worldY 만큼만 이동)
 * - 랩이 켜져 있으면: 3×3 타일을 그리되,
 *   worldX / worldY에 따라 기준 타일이 계속 돌아감.
 */
const tiles = computed(() => {
  const scale = state.scale
  const wrapX = props.enableWrapX && props.contentWidth > 0
  const wrapY = props.enableWrapY && props.contentHeight > 0

  // 랩을 안 쓰는 경우: 단일 타일만
  if (!wrapX && !wrapY) {
    return [
      {
        key: 'single',
        style: {
          transform: `translate3d(${state.worldX}px, ${state.worldY}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
        },
      },
    ]
  }

  const tileW = (props.contentWidth || 1) * scale
  const tileH = (props.contentHeight || 1) * scale

  const tilesArray = []

  // worldX/Y를 기준으로 기준 위치 계산
  const baseX = wrapX
    ? ((state.worldX % tileW) + tileW) % tileW - tileW
    : state.worldX
  const baseY = wrapY
    ? ((state.worldY % tileH) + tileH) % tileH - tileH
    : state.worldY

  const xCount = wrapX ? 3 : 1
  const yCount = wrapY ? 3 : 1

  for (let iy = 0; iy < yCount; iy++) {
    for (let ix = 0; ix < xCount; ix++) {
      const x = baseX + ix * tileW
      const y = baseY + iy * tileH

      tilesArray.push({
        key: `${ix}-${iy}`,
        style: {
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
        },
      })
    }
  }

  return tilesArray
})

defineExpose({
  reset,
})
</script>

<style scoped>
.pz-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.pz-root:active {
  cursor: grabbing;
}

.pz-layer {
  position: absolute;
  inset: 0;
}

/* 각 타일: 같은 슬롯 콘텐츠를 여러 번 깔기 위한 래퍼 */
.pz-tile {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

/* 슬롯 콘텐츠가 들어가는 실제 한 칸 */
.pz-content {
  position: relative;
}
</style>
