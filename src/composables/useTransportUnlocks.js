// src/composables/useTransportUnlocks.js
import { computed } from 'vue';
import { useResearch } from '@/composables/useResearch';
import { TRANSPORT_IDS, transportMeta } from '@/data/transports/meta';
import { researchCatalog } from '@/data/research/catalog';

function findUnlockResearchId(transportId, tier = 1) {
  const t = Number(tier || 1);
  const node = researchCatalog.find((r) =>
    (r.effects || []).some(
      (e) =>
        e.type === 'UNLOCK_TRANSPORT_TIER' &&
        e.transportId === transportId &&
        Number(e.tier || 1) === t
    )
  );
  return node?.id ?? null;
}

/**
 * 기본차량 프리뷰 연구(effect) 찾기
 * - catalog.js에 추가한 UNLOCK_STARTER_FLEET_PREVIEW를 인식
 */
function findStarterFleetPreviewResearch() {
  const node = researchCatalog.find((r) =>
    (r.effects || []).some((e) => e?.type === 'UNLOCK_STARTER_FLEET_PREVIEW')
  );
  if (!node) return { researchId: null, config: null };

  const eff = (node.effects || []).find((e) => e?.type === 'UNLOCK_STARTER_FLEET_PREVIEW') || null;

  const config = eff
    ? {
        transports: Array.isArray(eff.transports) ? eff.transports.filter(Boolean) : [],
        runTimeMinSec: Number(eff.runTimeMinSec || 0),
        runTimeMaxSec: Number(eff.runTimeMaxSec || 0),
        countPerTransport: Number(eff.countPerTransport || 1),
      }
    : null;

  return { researchId: node.id, config };
}

export function useTransportUnlocks() {
  const research = useResearch();

  // ---- 프리뷰(기본차량 자동운행) 상태 ----
  const starterFleetPreview = computed(() => findStarterFleetPreviewResearch());

  const previewResearchId = computed(() => starterFleetPreview.value.researchId);
  const previewConfig = computed(() => starterFleetPreview.value.config);

  // 연구 완료 여부(완료 Set 기반)
  const previewStarterFleetUnlocked = computed(() => {
    const rid = previewResearchId.value;
    if (!rid) return false;
    return !!research.completedIds.value?.has?.(rid);
  });

  // 프리뷰가 적용될 운송수단 목록(기본: bus/truck/rail)
  const previewAppliesTo = computed(() => {
    const cfg = previewConfig.value;
    if (!cfg) return new Set();
    return new Set(cfg.transports || []);
  });

  // ---- 운송수단 리스트 ----
  const transportTypes = computed(() => {
    const appliesSet = previewAppliesTo.value;
    const previewUnlocked = previewStarterFleetUnlocked.value;

    return TRANSPORT_IDS.map((id) => {
      const meta = transportMeta[id] || {};
      const name = meta.name ?? id;
      const icon = meta.icon ?? '❓';

      const tierUnlocked = Number(research.unlockedTransportTiers.value?.[id] || 0);
      const locked = tierUnlocked < 1;

      const unlockResearchId = findUnlockResearchId(id, 1);

      const isResearching =
        !!unlockResearchId && research.activeResearch.value?.id === unlockResearchId;

      let researchStartTime = null;
      let researchFinishTime = null;

      if (isResearching && research.activeResearch.value) {
        researchStartTime = new Date(research.activeResearch.value.startedAtMs);
        researchFinishTime = new Date(research.activeResearch.value.endsAtMs);
      }

      /**
       * ✅ 프리뷰 표시용 필드
       * - 실제 “랜덤 운행 타이머”는 다음 단계(사이드바 레이아웃+프리뷰 타이머 composable)에서 붙임
       * - 지금은 "프리뷰 가능/활성" 여부만 UI가 쓸 수 있게 제공
       */
      const previewEligible = appliesSet.has(id); // bus/truck/rail 등
      const previewActive = !!previewUnlocked && !locked && previewEligible;

      const previewLabel = previewActive ? '프리뷰 운행 가능' : null;

      return {
        id,
        name,
        icon,
        locked,
        isResearching,
        researchStartTime,
        researchFinishTime,
        unlockResearchId,

        // 프리뷰
        previewEligible,
        previewActive,
        previewLabel,
      };
    });
  });

  const lockedTransports = computed(() => transportTypes.value.filter((t) => t.locked));
  const unlockedTransports = computed(() => transportTypes.value.filter((t) => !t.locked));

  function unlockTransport(transportId) {
    const unlockResearchId = findUnlockResearchId(transportId, 1);
    if (!unlockResearchId) return;
    research.startResearch(unlockResearchId);
  }

  function getResearchProgress(transportId) {
    const unlockResearchId = findUnlockResearchId(transportId, 1);
    if (!unlockResearchId) return 0;
    return research.getResearchProgress(unlockResearchId);
  }

  function getResearchRemainingTime(transportId) {
    const unlockResearchId = findUnlockResearchId(transportId, 1);
    if (!unlockResearchId) return '00h 00m 00s';
    return research.getResearchRemainingTime(unlockResearchId);
  }

  return {
    transportTypes,
    lockedTransports,
    unlockedTransports,

    unlockTransport,
    getResearchProgress,
    getResearchRemainingTime,

    // 프리뷰(기본차량 자동운행) 공개 API
    previewResearchId,
    previewConfig,
    previewStarterFleetUnlocked,
  };
}
