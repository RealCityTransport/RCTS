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
 * ✅ 프리뷰 연구(effect) 전체 수집
 * - UNLOCK_STARTER_FLEET_PREVIEW effect가 포함된 연구가 여러 개여도 안전
 */
function findAllStarterFleetPreviewResearches() {
  const nodes = researchCatalog.filter((r) =>
    (r.effects || []).some((e) => e?.type === 'UNLOCK_STARTER_FLEET_PREVIEW')
  );

  const items = nodes.map((node) => {
    const eff =
      (node.effects || []).find((e) => e?.type === 'UNLOCK_STARTER_FLEET_PREVIEW') || null;

    const config = eff
      ? {
          transports: Array.isArray(eff.transports) ? eff.transports.filter(Boolean) : [],
          runTimeMinSec: Number(eff.runTimeMinSec || 0),
          runTimeMaxSec: Number(eff.runTimeMaxSec || 0),
          countPerTransport: Number(eff.countPerTransport || 1),
        }
      : null;

    return {
      researchId: node.id,
      config,
    };
  });

  return items;
}

export function useTransportUnlocks() {
  const research = useResearch();

  // ---- 프리뷰(기본차량) 관련 연구들(복수) ----
  const previewResearches = computed(() => findAllStarterFleetPreviewResearches());

  /**
   * ✅ 프리뷰 완료 판정(핵심)
   * - 프리뷰 연구가 여러 개여도, 하나라도 완료면 프리뷰 오픈
   */
  const previewStarterFleetUnlocked = computed(() => {
    const doneSet = research.completedIds.value;
    const list = previewResearches.value || [];
    if (!doneSet || list.length === 0) return false;
    return list.some((x) => x?.researchId && doneSet.has(x.researchId));
  });

  /**
   * ✅ UI 디버그/표시용 “현재 프리뷰 연구 ID”
   * - 완료된 게 있으면 그걸 우선 노출
   * - 없으면 첫 번째 후보 노출
   */
  const previewResearchId = computed(() => {
    const doneSet = research.completedIds.value;
    const list = previewResearches.value || [];
    if (!list.length) return null;

    const completedOne = doneSet
      ? list.find((x) => x?.researchId && doneSet.has(x.researchId))
      : null;

    return (completedOne?.researchId ?? list[0]?.researchId) || null;
  });

  /**
   * 프리뷰 설정값(완료된 연구의 config 우선, 없으면 첫 후보 config)
   */
  const previewConfig = computed(() => {
    const doneSet = research.completedIds.value;
    const list = previewResearches.value || [];
    if (!list.length) return null;

    const completedOne = doneSet
      ? list.find((x) => x?.researchId && doneSet.has(x.researchId))
      : null;

    return completedOne?.config ?? list[0]?.config ?? null;
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

      // ✅ 프리뷰 표시용
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

    // 프리뷰 공개 API
    previewResearchId,
    previewConfig,
    previewStarterFleetUnlocked,
  };
}