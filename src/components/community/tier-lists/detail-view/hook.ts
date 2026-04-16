"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useCardCatalog, useCardReferenceData } from "@/lib/universus/card-data-provider";
import type { CachedCard } from "@/lib/universus/card-store";
import {
  COMMUNITY_TIER_RANKING,
  normalizeScopeSetCodes,
  type CommunityTierRankingScope,
} from "../../../../../shared/app-config";
import {
  tierListPoolScopeKey,
  TIER_LIST_POOL_ALL_TYPES,
  type TierListPoolScope,
} from "../../../../../shared/tier-list-pool";
import type { BuilderLaneMap, BuilderTier } from "../types";
import {
  POOL_LANE_KEY,
  TIER_COLOR_SWATCHES,
  buildCardMap,
  buildLaneMapFromItems,
  createCanonicalRankedTiers,
  createDefaultTiers,
  getBackCard,
  getTierListScopeLabel,
  isCanonicalRankedTierList,
  isRankedTierListScope,
  reconcileLaneMap,
  serializeLaneMap,
  tierListCardMatchesPool,
} from "../utils";

type TierListDraftSnapshot = {
  title: string;
  description: string;
  isPublic: boolean;
  rankingScope: CommunityTierRankingScope;
  poolScopes: TierListPoolScope[];
  tiers: BuilderTier[];
  laneMap: BuilderLaneMap;
};

export function useCommunityTierListDetailModel(tierListId: string) {
  const router = useRouter();
  const detail = useQuery(api.tierLists.getDetail, { tierListId: tierListId as Id<"tierLists"> });
  const saveTierList = useMutation(api.tierLists.save);
  const deleteTierList = useMutation(api.tierLists.remove);
  const { cards } = useCardCatalog();
  const { sets } = useCardReferenceData();

  const [title, setTitle] = useState("Untitled Tier List");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [rankingScope, setRankingScope] = useState<CommunityTierRankingScope>(
    COMMUNITY_TIER_RANKING.scopes.unranked
  );
  const [poolScopes, setPoolScopes] = useState<TierListPoolScope[]>([]);
  const [tiers, setTiers] = useState<BuilderTier[]>(() => createDefaultTiers());
  const [laneMap, setLaneMap] = useState<BuilderLaneMap>(() => reconcileLaneMap([], createDefaultTiers()));
  const [poolSearch, setPoolSearch] = useState("");
  const [setSearch, setSetSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isPoolDialogOpen, setIsPoolDialogOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [pendingRankingScopeChange, setPendingRankingScopeChange] = useState<CommunityTierRankingScope | null>(null);
  const hydratedTierListIdRef = useRef<string | null>(null);
  const latestDraftRef = useRef<TierListDraftSnapshot | null>(null);
  const pendingAutoSaveDraftRef = useRef<TierListDraftSnapshot | null>(null);
  const isSavingRef = useRef(false);

  const cardMap = useMemo(() => buildCardMap(cards), [cards]);
  const canEdit = detail?.canEdit ?? false;

  const getDraftSnapshot = (overrides?: Partial<TierListDraftSnapshot>): TierListDraftSnapshot => {
    const base = latestDraftRef.current ?? {
      title,
      description,
      isPublic,
      rankingScope,
      poolScopes,
      tiers,
      laneMap,
    };

    return {
      ...base,
      ...overrides,
    };
  };

  const selectedSetCodes = useMemo(
    () => normalizeScopeSetCodes(poolScopes.map((scope) => scope.setCode)),
    [poolScopes]
  );

  useEffect(() => {
    if (!detail) {
      return;
    }

    const currentId = detail.tierList._id.toString();
    if (hydratedTierListIdRef.current === currentId) {
      return;
    }

    const nextTiers = detail.tierList.tiers.map((tier) => ({
      id: tier.id,
      label: tier.label,
      color: tier.color,
    }));
    const nextLaneMap = buildLaneMapFromItems(
      detail.items.map((item) => ({
        cardId: item.cardId,
        laneKey: item.laneKey,
        order: item.order,
      })),
      nextTiers
    );

    setTitle(detail.tierList.title);
    setDescription(detail.tierList.description ?? "");
    setIsPublic(detail.tierList.isPublic);
    setRankingScope(detail.tierList.rankingScope ?? COMMUNITY_TIER_RANKING.scopes.unranked);
    if (detail.tierList.poolScopes && detail.tierList.poolScopes.length > 0) {
      setPoolScopes(detail.tierList.poolScopes);
    } else if (detail.tierList.selectedSetCodes.length > 0) {
      setPoolScopes(
        detail.tierList.selectedSetCodes.map((setCode) => ({
          setCode,
          cardType: TIER_LIST_POOL_ALL_TYPES,
        }))
      );
    } else {
      setPoolScopes([]);
    }
    setTiers(nextTiers);
    setLaneMap(reconcileLaneMap(detail.items.map((item) => item.cardId), nextTiers, nextLaneMap));
    hydratedTierListIdRef.current = currentId;
  }, [detail]);

  useEffect(() => {
    latestDraftRef.current = {
      title,
      description,
      isPublic,
      rankingScope,
      poolScopes,
      tiers,
      laneMap,
    };
  }, [description, isPublic, laneMap, rankingScope, poolScopes, tiers, title]);

  const sourceCards = useMemo(() => {
    if (poolScopes.length === 0) {
      return [] as typeof cards;
    }

    return cards
      .filter((card) => tierListCardMatchesPool(card, poolScopes))
      .sort((left, right) => {
        if (left.setCode !== right.setCode) {
          return (left.setCode ?? "").localeCompare(right.setCode ?? "");
        }
        const leftCollector = Number.parseInt(left.collectorNumber ?? "0", 10);
        const rightCollector = Number.parseInt(right.collectorNumber ?? "0", 10);
        if (leftCollector !== rightCollector) {
          return leftCollector - rightCollector;
        }
        return left.name.localeCompare(right.name);
      });
  }, [cards, poolScopes]);

  const sourceCardIds = useMemo(() => sourceCards.map((card) => card._id), [sourceCards]);
  const sourceCardSignature = useMemo(() => sourceCardIds.map((cardId) => cardId.toString()).join("|"), [sourceCardIds]);
  const tierSignature = useMemo(() => tiers.map((tier) => tier.id).join("|"), [tiers]);

  useEffect(() => {
    setLaneMap((current) => reconcileLaneMap(sourceCardIds, tiers, current));
  }, [sourceCardSignature, tierSignature, sourceCardIds, tiers]);

  const selectedCards = useMemo(
    () =>
      sourceCardIds
        .map((cardId) => cardMap.get(cardId.toString()))
        .filter((card): card is CachedCard => Boolean(card)),
    [cardMap, sourceCardIds]
  );

  const poolCardIds = useMemo(() => laneMap[POOL_LANE_KEY] ?? [], [laneMap]);
  const filteredPoolCardIds = useMemo(() => {
    const normalizedSearch = poolSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return poolCardIds;
    }

    return poolCardIds.filter((cardId) => {
      const card = cardMap.get(cardId.toString());
      if (!card) {
        return false;
      }

      return (
        card.name.toLowerCase().includes(normalizedSearch) ||
        card.setCode?.toLowerCase().includes(normalizedSearch) ||
        card.type?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [cardMap, poolCardIds, poolSearch]);

  const presentationCard = useMemo(() => {
    const nextCardId = filteredPoolCardIds[0];
    if (!nextCardId) {
      return null;
    }

    return cardMap.get(nextCardId.toString()) ?? null;
  }, [cardMap, filteredPoolCardIds]);

  const visibleSets = useMemo(() => {
    const normalizedSearch = setSearch.trim().toLowerCase();
    return [...sets]
      .filter(
        (set) =>
          !normalizedSearch ||
          set.name.toLowerCase().includes(normalizedSearch) ||
          set.code.toLowerCase().includes(normalizedSearch)
      )
      .sort((left, right) => {
        const leftNumber = left.setNumber ?? 0;
        const rightNumber = right.setNumber ?? 0;
        if (leftNumber !== rightNumber) {
          return rightNumber - leftNumber;
        }
        return left.name.localeCompare(right.name);
      });
  }, [setSearch, sets]);

  const isRankedScope = isRankedTierListScope(rankingScope);
  const rankingScopeLabel = getTierListScopeLabel(rankingScope);
  const shouldConfirmRankedScopeReset =
    !isRankedScope && pendingRankingScopeChange !== null && isRankedTierListScope(pendingRankingScopeChange) && !isCanonicalRankedTierList(tiers);

  const saveSnapshot = async (
    snapshot: TierListDraftSnapshot,
    options?: { onSuccess?: () => void; successMessage?: string; silent?: boolean }
  ) => {
    if (!detail || !canEdit) {
      return false;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      await saveTierList({
        tierListId: detail.tierList._id,
        title: snapshot.title,
        isPublic: snapshot.isPublic,
        rankingScope: snapshot.rankingScope,
        selectedSetCodes: normalizeScopeSetCodes(snapshot.poolScopes.map((scope) => scope.setCode)),
        poolScopes: snapshot.poolScopes,
        tiers: snapshot.tiers.map((tier, order) => ({
          id: tier.id,
          label: tier.label,
          color: tier.color,
          order,
        })),
        items: serializeLaneMap(snapshot.laneMap, snapshot.tiers),
        ...(snapshot.description.trim() ? { description: snapshot.description.trim() } : {}),
      });

      if (!options?.silent) {
        toast.success(options?.successMessage ?? "Tier list saved.");
      }
      options?.onSuccess?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save tier list";
      toast.error(message);
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const flushPendingAutoSave = async () => {
    if (!pendingAutoSaveDraftRef.current || isSavingRef.current) {
      return;
    }

    const snapshot = pendingAutoSaveDraftRef.current;
    pendingAutoSaveDraftRef.current = null;

    await saveSnapshot(snapshot, { silent: true });

    if (pendingAutoSaveDraftRef.current) {
      void flushPendingAutoSave();
    }
  };

  const queueAutoSave = (snapshot: TierListDraftSnapshot) => {
    latestDraftRef.current = snapshot;
    pendingAutoSaveDraftRef.current = snapshot;

    if (!isSavingRef.current) {
      void flushPendingAutoSave();
    }
  };

  const moveCardToLane = (cardId: Id<"cards">, targetLaneKey: string) => {
    if (!canEdit) {
      return;
    }

    let nextLaneMapSnapshot: BuilderLaneMap | null = null;

    setLaneMap((current) => {
      const nextLaneMap: BuilderLaneMap = Object.fromEntries(
        Object.entries(current).map(([laneKey, laneCards]) => [laneKey, laneCards.filter((value) => value !== cardId)])
      );
      nextLaneMap[targetLaneKey] = [...(nextLaneMap[targetLaneKey] ?? []), cardId];
      nextLaneMapSnapshot = nextLaneMap;
      return nextLaneMap;
    });

    if (nextLaneMapSnapshot) {
      queueAutoSave(
        getDraftSnapshot({
          laneMap: nextLaneMapSnapshot,
        })
      );
    }
  };

  const setTierLabel = (tierId: string, value: string) => {
    if (isRankedScope) {
      return;
    }

    setTiers((current) => current.map((entry) => (entry.id === tierId ? { ...entry, label: value } : entry)));
  };

  const setTierColor = (tierId: string, value: string) => {
    if (isRankedScope) {
      return;
    }

    setTiers((current) => current.map((entry) => (entry.id === tierId ? { ...entry, color: value } : entry)));
  };

  const addPoolScope = (scope: TierListPoolScope) => {
    if (!canEdit) {
      return;
    }

    setPoolScopes((current) => {
      const key = tierListPoolScopeKey(scope);
      if (current.some((entry) => tierListPoolScopeKey(entry) === key)) {
        return current;
      }
      return [...current, scope];
    });
  };

  const removePoolScope = (scope: TierListPoolScope) => {
    if (!canEdit) {
      return;
    }

    const key = tierListPoolScopeKey(scope);
    setPoolScopes((current) => current.filter((entry) => tierListPoolScopeKey(entry) !== key));
  };

  const addTier = () => {
    if (isRankedScope) {
      return;
    }

    setTiers((current) => {
      const nextIndex = current.length;
      return [
        ...current,
        {
          id: `tier-${nextIndex + 1}`,
          label: `Tier ${nextIndex + 1}`,
          color: TIER_COLOR_SWATCHES[nextIndex % TIER_COLOR_SWATCHES.length],
        },
      ];
    });
  };

  const removeTier = (tierId: string) => {
    if (isRankedScope) {
      return;
    }

    setLaneMap((current) => {
      const removedCards = current[tierId] ?? [];
      return {
        ...current,
        [POOL_LANE_KEY]: [...(current[POOL_LANE_KEY] ?? []), ...removedCards],
        [tierId]: [],
      };
    });
    setTiers((current) => current.filter((tier) => tier.id !== tierId));
  };

  const applyRankingScope = (nextScope: CommunityTierRankingScope) => {
    if (nextScope === rankingScope) {
      return;
    }

    if (!isRankedTierListScope(rankingScope) && isRankedTierListScope(nextScope) && !isCanonicalRankedTierList(tiers)) {
      const canonicalRankedTiers = createCanonicalRankedTiers();
      setTiers(canonicalRankedTiers);
      setLaneMap(reconcileLaneMap(sourceCardIds, canonicalRankedTiers));
    }

    setRankingScope(nextScope);
    setPendingRankingScopeChange(null);
  };

  const requestRankingScopeChange = (nextScope: CommunityTierRankingScope) => {
    if (nextScope === rankingScope) {
      return;
    }

    if (!isRankedTierListScope(rankingScope) && isRankedTierListScope(nextScope) && !isCanonicalRankedTierList(tiers)) {
      setPendingRankingScopeChange(nextScope);
      return;
    }

    applyRankingScope(nextScope);
  };

  const cancelPendingRankingScopeChange = () => {
    setPendingRankingScopeChange(null);
  };

  const confirmPendingRankingScopeChange = () => {
    if (!pendingRankingScopeChange) {
      return;
    }

    applyRankingScope(pendingRankingScopeChange);
  };

  const persistTierList = async (options?: { onSuccess?: () => void; successMessage?: string }) => {
    if (!detail || !canEdit || isSavingRef.current) {
      return false;
    }

    return saveSnapshot(getDraftSnapshot(), options);
  };

  const handleDelete = async () => {
    if (!detail || !canEdit || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteTierList({ tierListId: detail.tierList._id });
      toast.success("Tier list deleted.");
      router.push("/community/tier-lists");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete tier list";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelMetaEditing = () => {
    if (!detail) {
      return;
    }

    setTitle(detail.tierList.title);
    setDescription(detail.tierList.description ?? "");
    setIsPublic(detail.tierList.isPublic);
    setRankingScope(detail.tierList.rankingScope ?? COMMUNITY_TIER_RANKING.scopes.unranked);
    setIsEditingMeta(false);
  };

  return {
    detail,
    canEdit,
    title,
    setTitle,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    rankingScope,
    rankingScopeLabel,
    isRankedScope,
    requestRankingScopeChange,
    pendingRankingScopeChange,
    shouldConfirmRankedScopeReset,
    cancelPendingRankingScopeChange,
    confirmPendingRankingScopeChange,
    poolScopes,
    selectedSetCodes,
    tiers,
    laneMap,
    poolSearch,
    setPoolSearch,
    setSearch,
    setSetSearch,
    isSaving,
    isDeleting,
    isEditingMeta,
    setIsEditingMeta,
    isPoolDialogOpen,
    setIsPoolDialogOpen,
    isPresentationMode,
    setIsPresentationMode,
    cardMap,
    selectedCards,
    filteredPoolCardIds,
    poolCardIds,
    presentationCard,
    visibleSets,
    sourceCards,
    moveCardToLane,
    setTierLabel,
    setTierColor,
    addPoolScope,
    removePoolScope,
    addTier,
    removeTier,
    persistTierList,
    handleDelete,
    cancelMetaEditing,
    getBackCard: (card: CachedCard) => getBackCard(cardMap, card),
  };
}
