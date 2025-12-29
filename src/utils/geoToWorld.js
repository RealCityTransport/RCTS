// src/utils/geoToWorld.js
import { WORLD_WIDTH_PX, WORLD_HEIGHT_PX } from '@/config/world'

/**
 * 단순 평면 투영:
 *  - 경도 -180 ~ 180 → X: 0 ~ width
 *  - 위도   90 ~ -90 → Y: 0 ~ height (위쪽이 북쪽이 되도록 뒤집기)
 */
export function latLngToWorldXY(
  lat,
  lng,
  width = WORLD_WIDTH_PX,
  height = WORLD_HEIGHT_PX,
) {
  // 가로: -180 ~ 180 → 0 ~ width
  const x = ((lng + 180) / 360) * width

  // 세로:  90 ~ -90  → 0 ~ height
  const y = ((90 - lat) / 180) * height

  return { x, y }
}
