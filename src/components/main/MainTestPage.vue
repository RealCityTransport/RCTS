<template>
  <div class="iso-demo">
    <h2 class="iso-title">RTS · Isometric 테스트 (OpenTTD 스타일)</h2>

    <div class="iso-canvas-wrapper">
      <canvas
        ref="canvasEl"
        class="iso-canvas"
        width="900"
        height="560"
      ></canvas>
    </div>

    <p class="iso-desc">
      직교 좌표 (x, y)를 아이소 좌표로 변환해서 표시하는 테스트 화면입니다.<br />
      초록 타일은 지면, 회색은 도로, 갈색 선은 선로, 파란색은 물입니다.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvasEl = ref(null)

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 기본 타일 사이즈
  const tileW = 64
  const tileH = 32

  const mapW = 16
  const mapH = 12

  // 간단한 타일 타입 정의
  const TILE_GROUND = 0
  const TILE_WATER = 1
  const TILE_ROAD = 2
  const TILE_TRACK = 3

  // 샘플 맵 데이터 (간단 패턴)
  const map = []

  for (let y = 0; y < mapH; y++) {
    const row = []
    for (let x = 0; x < mapW; x++) {
      let t = TILE_GROUND

      // 물 타일: 아래쪽 영역
      if (y >= mapH - 3 && x > 2 && x < mapW - 3) {
        t = TILE_WATER
      }

      // 도로: 대각선 방향 하나
      if (x - y === 1 || x - y === 2) {
        t = TILE_ROAD
      }

      // 선로: 반대 대각선
      if (x + y === 10 || x + y === 11) {
        t = TILE_TRACK
      }

      row.push(t)
    }
    map.push(row)
  }

  // 직교 → 아이소 변환
  function isoX(x, y) {
    return (x - y) * (tileW / 2)
  }

  function isoY(x, y) {
    return (x + y) * (tileH / 2)
  }

  // 타일 하나 그리기
  function drawTile(sx, sy, type) {
    // 다이아몬드 기본 형태
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + tileW / 2, sy + tileH / 2)
    ctx.lineTo(sx, sy + tileH)
    ctx.lineTo(sx - tileW / 2, sy + tileH / 2)
    ctx.closePath()

    // 바닥색
    switch (type) {
      case TILE_WATER:
        ctx.fillStyle = '#1d4ed8'
        break
      case TILE_ROAD:
      case TILE_TRACK:
        ctx.fillStyle = '#2f9e44'
        break
      default:
        ctx.fillStyle = '#3b9c34'
    }
    ctx.fill()

    // 외곽선
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.stroke()

    // 추가 디테일
    if (type === TILE_ROAD) {
      // 가운데 회색 도로
      ctx.beginPath()
      ctx.moveTo(sx, sy + 4)
      ctx.lineTo(sx + tileW / 2 - 4, sy + tileH / 2)
      ctx.lineTo(sx, sy + tileH - 4)
      ctx.lineTo(sx - tileW / 2 + 4, sy + tileH / 2)
      ctx.closePath()
      ctx.fillStyle = '#4b5563'
      ctx.fill()
    } else if (type === TILE_TRACK) {
      // 선로 두 줄
      ctx.strokeStyle = '#8d5524'
      ctx.lineWidth = 2
      // 위쪽 레일
      ctx.beginPath()
      ctx.moveTo(sx - tileW / 2 + 4, sy + tileH / 2 - 3)
      ctx.lineTo(sx + tileW / 2 - 4, sy + tileH / 2 + 3)
      ctx.stroke()
      // 아래쪽 레일
      ctx.beginPath()
      ctx.moveTo(sx - tileW / 2 + 4, sy + tileH / 2 + 3)
      ctx.lineTo(sx + tileW / 2 - 4, sy + tileH / 2 + 9)
      ctx.stroke()
      ctx.lineWidth = 1
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 간단한 배경 그라디언트
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height)
    g.addColorStop(0, '#020617')
    g.addColorStop(1, '#0b1120')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const offsetX = canvas.width / 2
    const offsetY = 80

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const sx = isoX(x, y) + offsetX
        const sy = isoY(x, y) + offsetY
        drawTile(sx, sy, map[y][x])
      }
    }
  }

  render()
})
</script>

<style scoped lang="scss">
$bg: #020617;
$border: #334155;

.iso-demo {
  padding: 16px 10px 20px;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SUIT', sans-serif;
  background: $bg;
}

.iso-title {
  font-size: 0.95rem;
  margin-bottom: 10px;
}

.iso-canvas-wrapper {
  border-radius: 10px;
  border: 1px solid $border;
  overflow: hidden;
  background: #020617;
}

.iso-canvas {
  display: block;
  width: 100%;
  max-width: 100%;
}

.iso-desc {
  margin-top: 8px;
  font-size: 0.8rem;
  opacity: 0.85;
  line-height: 1.5;
}
</style>
