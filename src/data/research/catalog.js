// src/data/research/catalog.js

/**
 * Research Catalog (v2 확장 스키마 적용)
 *
 * 기존 엔진 호환 필드(유지)
 * - tier: 1 = 운영, 2+ = 개발중/잠김 등 확장
 * - requires: 선행 연구 id 목록(완료되어야 시작 가능)
 * - revealAfter: 노출 트리거(완료되어야 화면에 노출) - tier2+는 엔진에서 항상 노출 처리 중
 * - enabled: false 이면 개발중(보이되 시작 불가)
 * - durationSec: 연구 시간(초). 0 또는 미지정이면 즉시 완료
 * - effects: 완료 시 적용되는 효과들
 *
 * 신규 분류/정리 필드(추가)
 * - type: SYSTEM | EFFICIENCY | TRANSPORT | CITY | REAL
 * - domain: research | transport | vehicle | route | construction | finance | city | simulation
 * - timePolicy:
 *    - FIXED    : 고정 시간(효율 미적용). 기능오픈 8시간 규칙 적용 대상.
 *    - SCALABLE : 효율 적용 가능(연구 효율화 영향 받음)
 *
 * NOTE (프리뷰 정책 - 오빠 확정 반영)
 * - 프리뷰 관련 연구는 2개만 유지
 * - 1) 프리뷰 차량 운행: 30분
 * - 2) 프리뷰 운행 자동화: 1시간
 * - 프리뷰 운행 시간: 운송수단 관계없이 30분~3시간 랜덤
 * - (자동화 연구 완료 전) 0초 -> 운행대기 + 버튼으로 수동 개시
 * - (자동화 연구 완료 후) 0초 -> 자동으로 다음 운행 개시 (엔진/프리뷰 런 로직에서 적용)
 *
 * NOTE (정리)
 * - 메뉴(차량/노선/건설/재정/도시)와 연결될 QOL/기반 연구들은
 *   현재 메뉴 개발이 미완이므로 카다로그에서 제거(보류)함.
 */

const HOUR = 3600;
const MIN = 60;
const DUR_SYSTEM_FIXED = 8 * HOUR;

export const researchCatalog = [
  // =========================================================
  // [SYSTEM] 기능 오픈 (고정 8시간 / 효율 미적용)
  // =========================================================
  {
    id: 'sys_unlock_vehicle',
    type: 'SYSTEM',
    domain: 'vehicle',
    timePolicy: 'FIXED',
    title: '차량 시스템 개방',
    desc: '현재 잠금 상태입니다. (추후 업데이트에서 오픈)',
    tier: 1,
    durationSec: DUR_SYSTEM_FIXED,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [{ type: 'UNLOCK_FEATURE', featureKey: 'vehicle' }],
  },
  {
    id: 'sys_unlock_route',
    type: 'SYSTEM',
    domain: 'route',
    timePolicy: 'FIXED',
    title: '노선 시스템 개방',
    desc: '현재 잠금 상태입니다. (추후 업데이트에서 오픈)',
    tier: 1,
    durationSec: DUR_SYSTEM_FIXED,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [{ type: 'UNLOCK_FEATURE', featureKey: 'route' }],
  },
  {
    id: 'sys_unlock_construction',
    type: 'SYSTEM',
    domain: 'construction',
    timePolicy: 'FIXED',
    title: '건설 시스템 개방',
    desc: '현재 잠금 상태입니다. (추후 업데이트에서 오픈)',
    tier: 1,
    durationSec: DUR_SYSTEM_FIXED,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [{ type: 'UNLOCK_FEATURE', featureKey: 'construction' }],
  },
  {
    id: 'sys_unlock_finance',
    type: 'SYSTEM',
    domain: 'finance',
    timePolicy: 'FIXED',
    title: '재정(자금) 시스템 개방',
    desc: '현재 잠금 상태입니다. (추후 업데이트에서 오픈)',
    tier: 1,
    durationSec: DUR_SYSTEM_FIXED,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [{ type: 'UNLOCK_FEATURE', featureKey: 'finance' }],
  },
  {
    id: 'sys_unlock_city',
    type: 'SYSTEM',
    domain: 'city',
    timePolicy: 'FIXED',
    title: '도시 시스템 개방',
    desc: '현재 잠금 상태입니다. (추후 업데이트에서 오픈)',
    tier: 1,
    durationSec: DUR_SYSTEM_FIXED,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [{ type: 'UNLOCK_FEATURE', featureKey: 'city' }],
  },

  // =========================================================
  // [REAL] 프리뷰 (2개만 유지)
  //
  // 요구 반영:
  // - 버스/트럭/철도 "하나라도" 해금되면 연구 가능 (OR 조건)
  //   -> catalog.requires는 AND만 표현 가능하므로, requires를 비우고
  //      엔진(getStatus)에서 OR 체크로 잠금 해제 처리한다.
  // =========================================================
  {
    id: 'sys_preview_starter_vehicles',
    type: 'REAL',
    domain: 'vehicle',
    timePolicy: 'SCALABLE',
    title: '프리뷰 차량 운행',
    desc: '해금된 운송수단(버스/트럭/철도)에 프리뷰 운행 시간이 부여됩니다. 운행이 끝나면 "운행대기" 상태가 되며, 버튼으로 다음 운행을 수동 개시합니다. (30분, 효율 적용)',
    tier: 1,
    // ✅ 정상화: 30분
    durationSec: 30 * MIN,
    requires: [],
    revealAfter: [],
    enabled: true,
    effects: [
      {
        type: 'UNLOCK_STARTER_FLEET_PREVIEW',
        transports: ['bus', 'truck', 'rail'],
        runTimeMinSec: 30 * MIN,
        runTimeMaxSec: 3 * HOUR,
        countPerTransport: 1,
        mode: 'MANUAL',
      },
    ],
  },
  {
    id: 'sys_preview_auto_assign',
    type: 'REAL',
    domain: 'simulation',
    timePolicy: 'SCALABLE',
    title: '프리뷰 운행 자동화',
    desc: '프리뷰 운행이 종료되면 자동으로 다음 운행이 시작됩니다. (1시간, 효율 적용)',
    tier: 1,
    durationSec: 1 * HOUR,
    requires: ['sys_preview_starter_vehicles'],
    revealAfter: [],
    enabled: true,
    effects: [
      { type: 'UNLOCK_FEATURE', featureKey: 'preview_auto_assign' },
      { type: 'SET_PREVIEW_RUN_MODE', mode: 'AUTO' },
    ],
  },

  // =========================================================
  // [CITY] 도시 스케일 업 (효율 적용 가능)
  // =========================================================
  {
    id: 'city_scale_region',
    type: 'CITY',
    domain: 'city',
    timePolicy: 'SCALABLE',
    title: '지역 단위 확장',
    desc: '도시 영향권을 "지역" 단위로 확장합니다.',
    tier: 1,
    durationSec: 4 * HOUR,
    requires: ['sys_unlock_city'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [{ type: 'SET_CITY_SCALE', scale: 'REGION' }],
  },
  {
    id: 'city_scale_city',
    type: 'CITY',
    domain: 'city',
    timePolicy: 'SCALABLE',
    title: '시 단위 확장',
    desc: '도시 영향권을 "시" 단위로 확장합니다. (국내선 운행 기반)',
    tier: 1,
    durationSec: 8 * HOUR,
    requires: ['city_scale_region'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [{ type: 'SET_CITY_SCALE', scale: 'CITY' }],
  },
  {
    id: 'city_scale_country',
    type: 'CITY',
    domain: 'city',
    timePolicy: 'SCALABLE',
    title: '나라 단위 확장',
    desc: '영향권을 "나라" 단위로 확장합니다. (해상 국내선/국제선 기반)',
    tier: 1,
    durationSec: 12 * HOUR,
    requires: ['city_scale_city'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [{ type: 'SET_CITY_SCALE', scale: 'COUNTRY' }],
  },
  {
    id: 'city_scale_state',
    type: 'CITY',
    domain: 'city',
    timePolicy: 'SCALABLE',
    title: '국가 단위 확장',
    desc: '영향권을 "국가" 단위로 확장합니다. (본격 국제선 운영 기반)',
    tier: 1,
    durationSec: 16 * HOUR,
    requires: ['city_scale_country'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [{ type: 'SET_CITY_SCALE', scale: 'STATE' }],
  },
  {
    id: 'city_scale_planet',
    type: 'CITY',
    domain: 'city',
    timePolicy: 'SCALABLE',
    title: '행성 단위 확장',
    desc: '영향권을 "행성" 단위로 확장합니다. (우주 운송 해금 기반)',
    tier: 1,
    durationSec: 24 * HOUR,
    requires: ['city_scale_state'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [{ type: 'SET_CITY_SCALE', scale: 'PLANET' }],
  },

  // =========================================================
  // [TRANSPORT] 운송수단 Tier1 해금
  // =========================================================
  {
    id: 'unlock_bus_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '버스 운송 체계 도입',
    desc: '버스 운송수단(티어1)을 해금합니다.',
    tier: 1,
    durationSec: 1 * HOUR,
    requires: [],
    revealAfter: [],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'bus', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'bus', tier: 1 },
    ],
  },
  {
    id: 'unlock_truck_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '트럭 운송 체계 도입',
    desc: '트럭 운송수단(티어1)을 해금합니다.',
    tier: 1,
    durationSec: 1 * HOUR,
    requires: [],
    revealAfter: [],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'truck', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'truck', tier: 1 },
    ],
  },
  {
    id: 'unlock_rail_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '철도 운송 체계 도입',
    desc: '철도 운송수단(티어1)을 해금합니다.',
    tier: 1,
    durationSec: 1 * HOUR,
    requires: [],
    revealAfter: [],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'rail', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'rail', tier: 1 },
    ],
  },

  // --- 도시 진척 이후 가능 ---
  {
    id: 'unlock_plane_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '항공 운송 체계 도입',
    desc: '비행기 운송수단(티어1)을 해금합니다. (도시 스케일: 시 단위 필요)',
    tier: 1,
    durationSec: 2 * HOUR,
    requires: ['sys_unlock_city', 'city_scale_city'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'plane', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'plane', tier: 1 },
    ],
  },
  {
    id: 'unlock_ship_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '해상 운송 체계 도입',
    desc: '배 운송수단(티어1)을 해금합니다. (도시 스케일: 나라 단위 필요)',
    tier: 1,
    durationSec: 2 * HOUR,
    requires: ['sys_unlock_city', 'city_scale_country'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'ship', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'ship', tier: 1 },
    ],
  },
  {
    id: 'unlock_spaceship_t1',
    type: 'TRANSPORT',
    domain: 'transport',
    timePolicy: 'SCALABLE',
    title: '우주 운송 체계 도입',
    desc: '우주선 운송수단(티어1)을 해금합니다. (도시 스케일: 행성 단위 필요)',
    tier: 1,
    durationSec: 3 * HOUR,
    requires: ['sys_unlock_city', 'city_scale_planet'],
    revealAfter: ['sys_unlock_city'],
    enabled: true,
    effects: [
      { type: 'UNLOCK_TRANSPORT_TIER', transportId: 'spaceship', tier: 1 },
      { type: 'GRANT_STARTER_VEHICLE', transportId: 'spaceship', tier: 1 },
    ],
  },

  // =========================================================
  // [EFFICIENCY] 연구 시간 감소 (레벨당 -5%)
  // =========================================================
  {
    id: 'rs_1',
    type: 'EFFICIENCY',
    domain: 'research',
    timePolicy: 'SCALABLE',
    title: '연구 효율화 I',
    desc: '효율 적용 대상 연구의 시간이 5% 감소합니다. (SYSTEM 기능오픈 8시간은 미적용)',
    tier: 1,
    durationSec: 1 * HOUR,
    requires: [],
    revealAfter: [],
    enabled: true,
    effects: [{ type: 'RESEARCH_SPEED_LEVEL', level: 1 }],
  },
  {
    id: 'rs_2',
    type: 'EFFICIENCY',
    domain: 'research',
    timePolicy: 'SCALABLE',
    title: '연구 효율화 II',
    desc: '효율 적용 대상 연구의 시간이 10% 감소합니다. (SYSTEM 기능오픈 8시간은 미적용)',
    tier: 1,
    durationSec: 2 * HOUR,
    requires: ['rs_1'],
    revealAfter: [],
    enabled: true,
    effects: [{ type: 'RESEARCH_SPEED_LEVEL', level: 2 }],
  },
  {
    id: 'rs_3',
    type: 'EFFICIENCY',
    domain: 'research',
    timePolicy: 'SCALABLE',
    title: '연구 효율화 III',
    desc: '효율 적용 대상 연구의 시간이 15% 감소합니다. (SYSTEM 기능오픈 8시간은 미적용)',
    tier: 1,
    durationSec: 4 * HOUR,
    requires: ['rs_2'],
    revealAfter: [],
    enabled: true,
    effects: [{ type: 'RESEARCH_SPEED_LEVEL', level: 3 }],
  },
  {
    id: 'rs_4',
    type: 'EFFICIENCY',
    domain: 'research',
    timePolicy: 'SCALABLE',
    title: '연구 효율화 IV',
    desc: '효율 적용 대상 연구의 시간이 20% 감소합니다. (SYSTEM 기능오픈 8시간은 미적용)',
    tier: 1,
    durationSec: 8 * HOUR,
    requires: ['rs_3'],
    revealAfter: [],
    enabled: true,
    effects: [{ type: 'RESEARCH_SPEED_LEVEL', level: 4 }],
  },
  {
    id: 'rs_5',
    type: 'EFFICIENCY',
    domain: 'research',
    timePolicy: 'SCALABLE',
    title: '연구 효율화 V',
    desc: '효율 적용 대상 연구의 시간이 25% 감소합니다. (SYSTEM 기능오픈 8시간은 미적용)',
    tier: 1,
    durationSec: 16 * HOUR,
    requires: ['rs_4'],
    revealAfter: [],
    enabled: true,
    effects: [{ type: 'RESEARCH_SPEED_LEVEL', level: 5 }],
  },

  // =========================================================
  // Tier2 예시(개발중): 보이되 시작 불가
  // =========================================================
  {
    id: 't2_transport_foundation',
    type: 'REAL',
    domain: 'simulation',
    timePolicy: 'SCALABLE',
    title: '운송수단 레벨2 기초 설계(개발중)',
    desc: '레벨2 운송 확장 기반입니다. 업데이트에서 조건이 추가됩니다.',
    tier: 2,
    durationSec: 12 * HOUR,
    requires: [],
    revealAfter: [],
    enabled: false,
    effects: [],
  },
];

export function getResearchDef(id) {
  return researchCatalog.find((x) => x.id === id) || null;
}
