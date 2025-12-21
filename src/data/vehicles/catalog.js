// src/data/vehicles/catalog.js
// 차량 정의(카탈로그)만 담당. 연구/경제 로직은 여기 두지 않음.

export const VEHICLE_CATALOG_VERSION = 1;

export const vehicleCatalog = [
  {
    id: "bus_basic",
    category: "bus",
    name: "도시 버스 (기본)",
    desc: "초기 대중교통 수익원.",
    purchaseCost: 1000,
    baseIncomePerSec: 1.2, // 초당 수익(정밀 루프에 유리)
  },
  {
    id: "truck_basic",
    category: "truck",
    name: "화물 트럭 (기본)",
    desc: "육상 물류 기반.",
    purchaseCost: 3500,
    baseIncomePerSec: 4.5,
  },
  {
    id: "rail_basic",
    category: "rail",
    name: "통근 열차 (기본)",
    desc: "대량 수송으로 안정적 수익.",
    purchaseCost: 12000,
    baseIncomePerSec: 18,
  },
];

export function getVehicleDef(vehicleId) {
  return vehicleCatalog.find(v => v.id === vehicleId) || null;
}
