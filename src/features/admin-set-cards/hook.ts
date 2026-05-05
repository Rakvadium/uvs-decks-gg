"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { loadAdminSetCardsCache, saveAdminSetCardsCache, type AdminSetCardRow } from "./cache";

export type AdminSetCardsSort = "collector_asc" | "collector_desc" | "name_asc" | "name_desc";

const SLICE_PAGE = 40;

function parseCollector(n: string | undefined): number {
  if (!n) return Number.MAX_SAFE_INTEGER;
  const x = parseInt(n.replace(/\D/g, "") || "0", 10);
  return Number.isFinite(x) ? x : Number.MAX_SAFE_INTEGER;
}

function normalize(s: string | undefined) {
  return (s ?? "").toLowerCase();
}

export function useAdminSetCardsModel(
  setCode: string,
  opts?: { infiniteScrollRoot?: "self" | "viewport" }
) {
  const versionDoc = useQuery(api.admin.getCardDataVersion, {});
  const liveCards = useQuery(api.admin.listCardsBySetCode, { setCode });
  const [bootstrapped, setBootstrapped] = useState<AdminSetCardRow[] | null>(null);
  const [bootSetCode, setBootSetCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAdminSetCardsCache(setCode).then((e) => {
      if (cancelled) return;
      if (!e) {
        setBootstrapped(null);
        setBootSetCode(setCode);
        return;
      }
      setBootstrapped(e.cards);
      setBootSetCode(setCode);
    });
    return () => {
      cancelled = true;
    };
  }, [setCode]);

  useEffect(() => {
    if (liveCards === undefined || versionDoc?.version === undefined) return;
    void saveAdminSetCardsCache(setCode, versionDoc.version, liveCards);
  }, [liveCards, setCode, versionDoc?.version]);

  const sourceCards = useMemo(() => {
    if (liveCards !== undefined) return liveCards;
    if (bootSetCode !== setCode) return [];
    return bootstrapped ?? [];
  }, [liveCards, bootstrapped, bootSetCode, setCode]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [collectorQ, setCollectorQ] = useState("");
  const [onlyFront, setOnlyFront] = useState(true);
  const [includeVariants, setIncludeVariants] = useState(true);
  const [sort, setSort] = useState<AdminSetCardsSort>("collector_asc");

  const typeOptions = useMemo(() => {
    const u = new Set<string>();
    for (const c of sourceCards) {
      if (c.type) u.add(c.type);
    }
    return Array.from(u).sort();
  }, [sourceCards]);

  const rarityOptions = useMemo(() => {
    const u = new Set<string>();
    for (const c of sourceCards) {
      if (c.rarity) u.add(c.rarity);
    }
    return Array.from(u).sort();
  }, [sourceCards]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cq = collectorQ.trim().toLowerCase();
    let rows = sourceCards.filter((c) => {
      if (onlyFront && c.isFrontFace === false) return false;
      if (!includeVariants && c.isVariant === true) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (rarityFilter && c.rarity !== rarityFilter) return false;
      if (cq && !normalize(c.collectorNumber).includes(cq)) return false;
      if (q) {
        const fields = [c.name, c.searchName, c.searchAll, c.collectorNumber, c.type, c.text];
        if (!fields.some((f) => normalize(f).includes(q))) return false;
      }
      return true;
    });

    rows = [...rows];
    if (sort === "name_asc" || sort === "name_desc") {
      const dir = sort === "name_asc" ? 1 : -1;
      rows.sort((a, b) => (a.name < b.name ? -dir : a.name > b.name ? dir : 0));
    } else {
      const dir = sort === "collector_asc" ? 1 : -1;
      rows.sort((a, b) => {
        const na = parseCollector(a.collectorNumber);
        const nb = parseCollector(b.collectorNumber);
        if (na !== nb) return na < nb ? -dir : dir;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
    }
    return rows;
  }, [
    sourceCards,
    search,
    typeFilter,
    rarityFilter,
    collectorQ,
    onlyFront,
    includeVariants,
    sort,
  ]);

  const filterKey = `${setCode}|${search}|${typeFilter}|${rarityFilter}|${collectorQ}|${onlyFront}|${includeVariants}|${sort}|${sourceCards.length}`;

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sliceRoot =
    opts?.infiniteScrollRoot === "viewport" ? undefined : scrollRootRef;
  const { visibleItems, hasMore, loadMoreRef } = useInfiniteSlice({
    items: filteredSorted,
    pageSize: SLICE_PAGE,
    resetKey: filterKey,
    rootRef: sliceRoot,
    rootMargin: "240px",
  });

  const isLoadingList = liveCards === undefined && bootstrapped === null;

  const bumpLocalCache = useCallback(() => {
    setBootstrapped(null);
  }, []);

  return {
    sourceCards,
    filteredSorted,
    visibleItems,
    hasMore,
    loadMoreRef,
    isLoadingList,
    versionDoc,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    rarityFilter,
    setRarityFilter,
    collectorQ,
    setCollectorQ,
    onlyFront,
    setOnlyFront,
    includeVariants,
    setIncludeVariants,
    sort,
    setSort,
    typeOptions,
    rarityOptions,
    bumpLocalCache,
    scrollRootRef,
  };
}
