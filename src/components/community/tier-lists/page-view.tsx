"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Layers3, Loader2, Lock, Plus, Save, Sparkles, Trash2, Unlock, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCardData, type CachedCard } from "@/lib/universus";
import { CardGridItem } from "@/components/universus";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { useTcgDroppable } from "@/lib/dnd";
import {
  POOL_LANE_KEY,
  TIER_COLOR_SWATCHES,
  buildCardMap,
  buildLaneMapFromItems,
  createDefaultTiers,
  getBackCard,
  reconcileLaneMap,
  serializeLaneMap,
  type BuilderLaneMap,
  type BuilderTier,
} from "./shared";
import { TierListFeed } from "./feed";

function withAlpha(color: string, alpha: string) {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}${alpha}`;
  }

  return color;
}

export function CommunityTierListsPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const { cards, sets, isLoading } = useCardData();
  const saveTierList = useMutation(api.tierLists.save);
  const myTierLists = useQuery(api.tierLists.listMine, isAuthenticated ? { limit: 12 } : "skip");
  const editableTierList = useQuery(
    api.tierLists.getEditable,
    editParam ? { tierListId: editParam as Id<"tierLists"> } : "skip"
  );

  const [title, setTitle] = useState("Untitled Tier List");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedSetCodes, setSelectedSetCodes] = useState<string[]>([]);
  const [tiers, setTiers] = useState<BuilderTier[]>(() => createDefaultTiers());
  const [laneMap, setLaneMap] = useState<BuilderLaneMap>(() => reconcileLaneMap([], createDefaultTiers()));
  const [setSearch, setSetSearch] = useState("");
  const [poolSearch, setPoolSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const lastHydratedEditRef = useRef<string | null>(null);

  const cardMap = useMemo(() => buildCardMap(cards), [cards]);
  const visibleSets = useMemo(() => {
    const normalizedSearch = setSearch.trim().toLowerCase();
    return [...sets]
      .filter((set) => !normalizedSearch || set.name.toLowerCase().includes(normalizedSearch) || set.code.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => {
        const leftNumber = left.setNumber ?? 0;
        const rightNumber = right.setNumber ?? 0;
        if (leftNumber !== rightNumber) {
          return rightNumber - leftNumber;
        }
        return left.name.localeCompare(right.name);
      });
  }, [setSearch, sets]);

  const sourceCards = useMemo(() => {
    if (selectedSetCodes.length === 0) {
      return [] as typeof cards;
    }

    const allowedSetCodes = new Set(selectedSetCodes);
    return cards
      .filter((card) => card.isFrontFace !== false && card.isVariant !== true)
      .filter((card) => card.setCode && allowedSetCodes.has(card.setCode))
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
  }, [cards, selectedSetCodes]);

  const sourceCardIds = useMemo(() => sourceCards.map((card) => card._id), [sourceCards]);
  const sourceCardSignature = useMemo(() => sourceCardIds.map((cardId) => cardId.toString()).join("|"), [sourceCardIds]);
  const tierSignature = useMemo(() => tiers.map((tier) => tier.id).join("|"), [tiers]);

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

  useEffect(() => {
    setLaneMap((current) => reconcileLaneMap(sourceCardIds, tiers, current));
  }, [sourceCardSignature, tierSignature, sourceCardIds, tiers]);

  useEffect(() => {
    if (!editParam) {
      if (lastHydratedEditRef.current !== null) {
        const defaultTiers = createDefaultTiers();
        setTitle("Untitled Tier List");
        setDescription("");
        setIsPublic(false);
        setSelectedSetCodes([]);
        setTiers(defaultTiers);
        setLaneMap(reconcileLaneMap([], defaultTiers));
        lastHydratedEditRef.current = null;
      }
      return;
    }

    if (editableTierList === undefined || editableTierList === null) {
      return;
    }

    if (lastHydratedEditRef.current === editParam) {
      return;
    }

    const nextTiers = editableTierList.tierList.tiers.map((tier) => ({
      id: tier.id,
      label: tier.label,
      color: tier.color,
    }));
    const nextLaneMap = buildLaneMapFromItems(
      editableTierList.items.map((item) => ({
        cardId: item.cardId,
        laneKey: item.laneKey,
        order: item.order,
      })),
      nextTiers
    );

    setTitle(editableTierList.tierList.title);
    setDescription(editableTierList.tierList.description ?? "");
    setIsPublic(editableTierList.tierList.isPublic);
    setSelectedSetCodes(editableTierList.tierList.selectedSetCodes);
    setTiers(nextTiers);
    setLaneMap(reconcileLaneMap(editableTierList.items.map((item) => item.cardId), nextTiers, nextLaneMap));
    lastHydratedEditRef.current = editParam;
  }, [editParam, editableTierList]);

  const toggleSetCode = (setCode: string) => {
    setSelectedSetCodes((current) =>
      current.includes(setCode) ? current.filter((code) => code !== setCode) : [...current, setCode]
    );
  };

  const moveCardToLane = (cardId: Id<"cards">, targetLaneKey: string) => {
    setLaneMap((current) => {
      const nextLaneMap: BuilderLaneMap = Object.fromEntries(
        Object.entries(current).map(([laneKey, laneCards]) => [laneKey, laneCards.filter((value) => value !== cardId)])
      );
      nextLaneMap[targetLaneKey] = [...(nextLaneMap[targetLaneKey] ?? []), cardId];
      return nextLaneMap;
    });
  };

  const addTier = () => {
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

  const resetDraft = () => {
    router.replace("/community/tier-lists");
    const defaultTiers = createDefaultTiers();
    setTitle("Untitled Tier List");
    setDescription("");
    setIsPublic(false);
    setSelectedSetCodes([]);
    setTiers(defaultTiers);
    setLaneMap(reconcileLaneMap([], defaultTiers));
    setPoolSearch("");
    setSetSearch("");
    lastHydratedEditRef.current = null;
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (selectedSetCodes.length === 0) {
      toast.error("Choose at least one set before saving a tier list.");
      return;
    }

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title,
        isPublic,
        selectedSetCodes,
        tiers: tiers.map((tier, index) => ({
          id: tier.id,
          label: tier.label,
          color: tier.color,
          order: index,
        })),
        items: serializeLaneMap(laneMap, tiers),
        ...(editParam ? { tierListId: editParam as Id<"tierLists"> } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      };
      const result = await saveTierList(payload);
      toast.success(isPublic ? "Tier list published to the community feed." : "Tier list saved privately.");
      router.replace(`/community/tier-lists?edit=${result.tierListId}`);
      lastHydratedEditRef.current = result.tierListId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save tier list";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTierListLink = editParam ? `/community/tier-lists/${editParam}` : null;

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.14),transparent_28%)]" />

      <div className="relative z-10 space-y-8 p-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyber">Community Lab</Badge>
            <Badge variant="outline">Local cached card pool</Badge>
            <Badge variant="outline">Drag to rank</Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-primary/20 bg-card/70">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl md:text-3xl">Tier List Maker</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-relaxed">
                  Start from the default A-D scale, rename the lanes however you want, choose the sets you want to evaluate,
                  and drag cards from the pool into horizontal swim lanes. Saved public lists land in the community feed.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={resetDraft}>
                  <Wand2 className="h-4 w-4" />
                  New draft
                </Button>
                <Button variant="default" onClick={handleSave} disabled={isSaving || isLoading}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save tier list
                </Button>
                {activeTierListLink ? (
                  <Button variant="ghost" asChild>
                    <Link href={activeTierListLink}>Open shared page</Link>
                  </Button>
                ) : null}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Default Settings</CardTitle>
                <CardDescription>
                  Four starter tiers, private by default, and card selection sourced from your locally cached Universus data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Visibility</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant={isPublic ? "outline" : "default"}
                        size="sm"
                        onClick={() => setIsPublic(false)}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Private
                      </Button>
                      <Button
                        variant={isPublic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPublic(true)}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Public
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Active Pool</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span>{selectedSetCodes.length} sets</span>
                      <span className="text-muted-foreground">{sourceCards.length} cards</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Sharing flow
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Private lists stay on your account. Public lists show up in the feed below and on the main community page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle className="text-lg">List Identity</CardTitle>
                <CardDescription>Name it, describe what you are ranking, then choose the source sets below.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Title</label>
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled Tier List" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Visibility</label>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        variant={isPublic ? "outline" : "default"}
                        onClick={() => setIsPublic(false)}
                      >
                        Private
                      </Button>
                      <Button
                        className="flex-1"
                        variant={isPublic ? "default" : "outline"}
                        onClick={() => setIsPublic(true)}
                      >
                        Public
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Description</label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Example: Season 7 foundations, ranked for blind-first-pick testing."
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <CardTitle className="text-lg">Choose the Cards to Evaluate</CardTitle>
                <CardDescription>
                  This selector reads from the app&apos;s cached card database so you are not re-running the full Convex card query.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={setSearch}
                  onChange={(event) => setSetSearch(event.target.value)}
                  placeholder="Filter sets by code or name"
                />
                <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {visibleSets.map((set) => {
                    const isSelected = selectedSetCodes.includes(set.code);
                    return (
                      <button
                        key={set._id}
                        type="button"
                        onClick={() => toggleSetCode(set.code)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-10px_var(--primary)]"
                            : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{set.name}</p>
                          <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                            {set.code}
                            {set.cardCount ? ` · ${set.cardCount} cards` : ""}
                          </p>
                        </div>
                        <Badge variant={isSelected ? "default" : "outline"}>{isSelected ? "Selected" : "Add set"}</Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Tier Lanes</CardTitle>
                    <CardDescription>Rename each lane, customize it, and drag cards horizontally into rank order.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addTier}>
                    <Plus className="h-4 w-4" />
                    Add tier
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardNavigationProvider cards={sourceCards} getBackCard={(card) => getBackCard(cardMap, card)}>
                  {tiers.map((tier) => (
                    <TierLaneRow
                      key={tier.id}
                      tier={tier}
                      cardIds={laneMap[tier.id] ?? []}
                      cardMap={cardMap}
                      onMoveCard={moveCardToLane}
                      onLabelChange={(value) =>
                        setTiers((current) =>
                          current.map((entry) => (entry.id === tier.id ? { ...entry, label: value } : entry))
                        )
                      }
                      onColorChange={(value) =>
                        setTiers((current) =>
                          current.map((entry) => (entry.id === tier.id ? { ...entry, color: value } : entry))
                        )
                      }
                      onRemove={tiers.length > 1 ? () => removeTier(tier.id) : undefined}
                    />
                  ))}

                  <TierPoolSection
                    cardIds={filteredPoolCardIds}
                    totalPoolCount={poolCardIds.length}
                    cardMap={cardMap}
                    searchValue={poolSearch}
                    onSearchChange={setPoolSearch}
                    onMoveCard={moveCardToLane}
                  />
                </CardNavigationProvider>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">My Tier Lists</CardTitle>
                <CardDescription>
                  Load an existing private or public list into the editor, or start a fresh draft.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAuthenticated ? (
                  myTierLists === undefined ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : myTierLists.length > 0 ? (
                    myTierLists.map((tierList) => (
                      <button
                        key={tierList._id}
                        type="button"
                        onClick={() => router.replace(`/community/tier-lists?edit=${tierList._id}`)}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-all",
                          editParam === tierList._id
                            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-10px_var(--primary)]"
                            : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{tierList.title}</p>
                            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                              {tierList.itemCount} cards · {tierList.tierCount} tiers
                            </p>
                          </div>
                          <Badge variant={tierList.isPublic ? "default" : "outline"}>
                            {tierList.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">
                      You have not saved a tier list yet.
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">
                    Sign in to store personal tier lists, keep private drafts, and share rankings publicly.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Current Draft Stats</CardTitle>
                <CardDescription>Quick read on the list you are editing before you publish it.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Selected sets</span>
                  <span className="text-sm font-semibold">{selectedSetCodes.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Cards in pool</span>
                  <span className="text-sm font-semibold">{sourceCards.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Cards already ranked</span>
                  <span className="text-sm font-semibold">{sourceCards.length - poolCardIds.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Visibility</span>
                  <span className="text-sm font-semibold">{isPublic ? "Public" : "Private"}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={handleSave} disabled={isSaving || isLoading}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                {activeTierListLink ? (
                  <Button className="flex-1" variant="outline" asChild>
                    <Link href={activeTierListLink}>Preview</Link>
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          </div>
        </div>

        <TierListFeed
          title="Community Tier List Feed"
          description="Freshly published public rankings from the UniVersus community."
          limit={6}
          showBrowseLink={false}
        />
      </div>
    </div>
  );
}

function TierLaneRow({
  tier,
  cardIds,
  cardMap,
  onMoveCard,
  onLabelChange,
  onColorChange,
  onRemove,
}: {
  tier: BuilderTier;
  cardIds: Id<"cards">[];
  cardMap: Map<string, CachedCard>;
  onMoveCard: (cardId: Id<"cards">, laneKey: string) => void;
  onLabelChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const { isOver, canDrop, droppableProps } = useTcgDroppable({
    id: `tier-list-${tier.id}`,
    accepts: ["card"],
    onDrop: (item) => onMoveCard(item.card._id, tier.id),
  });

  return (
    <div
      {...droppableProps}
      className={cn(
        "rounded-2xl border p-4 transition-all",
        canDrop && "shadow-[0_0_20px_-15px_var(--primary)]",
        isOver && "scale-[1.005]"
      )}
      style={{
        borderColor: canDrop ? withAlpha(tier.color, "88") : withAlpha(tier.color, "44"),
        backgroundColor: isOver ? withAlpha(tier.color, "20") : withAlpha(tier.color, "10"),
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={tier.color}
          onChange={(event) => onColorChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-border/50 bg-transparent"
        />
        <Input
          value={tier.label}
          onChange={(event) => onLabelChange(event.target.value)}
          className="max-w-40 bg-background/70"
        />
        <Badge variant="outline">{cardIds.length} cards</Badge>
        {onRemove ? (
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {cardIds.length > 0 ? (
          cardIds.map((cardId) => {
            const card = cardMap.get(cardId.toString());
            if (!card) {
              return null;
            }

            return (
              <div key={card._id} className="w-28 shrink-0 md:w-32">
                <CardGridItem
                  card={card}
                  backCard={getBackCard(cardMap, card)}
                  dragSourceId={`tier-list:${tier.id}`}
                  showDeckActions={false}
                />
              </div>
            );
          })
        ) : (
          <div className="flex min-h-32 w-full items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/30 text-sm text-muted-foreground">
            Drag cards here
          </div>
        )}
      </div>
    </div>
  );
}

function TierPoolSection({
  cardIds,
  totalPoolCount,
  cardMap,
  searchValue,
  onSearchChange,
  onMoveCard,
}: {
  cardIds: Id<"cards">[];
  totalPoolCount: number;
  cardMap: Map<string, CachedCard>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMoveCard: (cardId: Id<"cards">, laneKey: string) => void;
}) {
  const { isOver, canDrop, droppableProps } = useTcgDroppable({
    id: "tier-list-pool",
    accepts: ["card"],
    onDrop: (item) => onMoveCard(item.card._id, POOL_LANE_KEY),
  });

  return (
    <div
      {...droppableProps}
      className={cn(
        "rounded-2xl border border-border/50 bg-background/40 p-4 transition-all",
        canDrop && "border-primary/30",
        isOver && "bg-primary/8"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Card Pool</p>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {totalPoolCount} cards waiting to be ranked
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search the pool" />
        </div>
      </div>

      {cardIds.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {cardIds.map((cardId) => {
            const card = cardMap.get(cardId.toString());
            if (!card) {
              return null;
            }

            return (
              <div key={card._id} className="content-visibility-auto">
                <CardGridItem
                  card={card}
                  backCard={getBackCard(cardMap, card)}
                  dragSourceId="tier-list:pool"
                  showDeckActions={false}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/20 text-sm text-muted-foreground">
          Select one or more sets to populate the pool.
        </div>
      )}
    </div>
  );
}
