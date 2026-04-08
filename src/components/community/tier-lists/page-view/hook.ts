"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { FolderOpen, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { useCardData } from "@/lib/universus";
import {
  COMMUNITY_TIER_RANKING,
  type CommunityTierRankingScope,
} from "../../../../../shared/app-config";
import { buildCardMap, createCanonicalRankedTiers, createDefaultTiers } from "../utils";

export type TierListBrowserTab = "public" | "mine";

export const BROWSER_TABS = [
  { id: "public", label: "Public", icon: Globe },
  { id: "mine", label: "My Lists", icon: FolderOpen },
] as const;

function matchesTierListSearch({
  search,
  tierList,
  authorLabel,
}: {
  search: string;
  tierList: Doc<"tierLists">;
  authorLabel?: string | null;
}) {
  if (!search) {
    return true;
  }

  const haystack = [tierList.title, tierList.description, authorLabel, tierList.selectedSetCodes.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

export function useCommunityTierListsPageModel() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const publicLists = useQuery(api.tierLists.listPublicFeed, { limit: 48 });
  const myLists = useQuery(api.tierLists.listMine, isAuthenticated ? { limit: 48 } : "skip");
  const saveTierList = useMutation(api.tierLists.save);
  const { cards } = useCardData();

  const [activeTab, setActiveTab] = useState<TierListBrowserTab>("public");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newRankingScope, setNewRankingScope] = useState<CommunityTierRankingScope>(
    COMMUNITY_TIER_RANKING.scopes.unranked
  );
  const [isCreating, setIsCreating] = useState(false);

  const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
  const cardMap = useMemo(() => buildCardMap(cards), [cards]);

  const filteredPublicLists = useMemo(
    () =>
      (publicLists ?? []).filter((entry) =>
        matchesTierListSearch({
          search: normalizedSearch,
          tierList: entry.tierList,
          authorLabel: entry.author?.username ?? entry.author?.email ?? null,
        })
      ),
    [normalizedSearch, publicLists]
  );

  const filteredMyLists = useMemo(
    () =>
      (myLists ?? []).filter((tierList) =>
        matchesTierListSearch({
          search: normalizedSearch,
          tierList,
        })
      ),
    [myLists, normalizedSearch]
  );

  const isLoadingActiveTab =
    activeTab === "public"
      ? publicLists === undefined
      : isAuthenticated
        ? myLists === undefined
        : false;

  const handleOpenCreateDialog = () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      const starterTiers = (
        newRankingScope === COMMUNITY_TIER_RANKING.scopes.unranked
          ? createDefaultTiers()
          : createCanonicalRankedTiers()
      ).map((tier, order) => ({
        ...tier,
        order,
      }));
      const result = await saveTierList({
        title: newListName.trim() || "Untitled Tier List",
        isPublic: false,
        rankingScope: newRankingScope,
        selectedSetCodes: [],
        tiers: starterTiers,
        items: [],
      });

      setIsCreateOpen(false);
      setNewListName("");
      setNewRankingScope(COMMUNITY_TIER_RANKING.scopes.unranked);
      toast.success("Tier list created.");
      router.push(`/community/tier-lists/${result.tierListId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create tier list";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isCreateOpen,
    setIsCreateOpen,
    newListName,
    setNewListName,
    newRankingScope,
    setNewRankingScope,
    isCreating,
    isAuthenticated,
    openAuthDialog,
    handleOpenCreateDialog,
    handleCreate,
    publicLists,
    myLists,
    filteredPublicLists,
    filteredMyLists,
    isLoadingActiveTab,
    cardMap,
  };
}
