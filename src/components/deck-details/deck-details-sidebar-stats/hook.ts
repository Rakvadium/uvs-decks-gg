import { useMemo } from "react";
import { formatUniversusCardType } from "@/config/universus";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData, type CachedCard } from "@/lib/universus";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { buildDeckEntriesFromQuantities, extractZones, toSortedBuckets } from "../deck-list-utils";

interface DistributionBucket {
  label: string;
  value: number;
}

function buildNumericDistribution(
  entries: Array<{ card: CachedCard; quantity: number }>,
  extractor: (card: CachedCard) => number | undefined | null
): DistributionBucket[] {
  const record: Record<string, number> = {};

  for (const entry of entries) {
    const value = extractor(entry.card);
    const key = typeof value === "number" ? String(value) : "None";
    record[key] = (record[key] ?? 0) + entry.quantity;
  }

  return Object.entries(record)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}

function buildZoneDistribution(
  entries: Array<{ card: CachedCard; quantity: number }>,
  zoneSelector: (card: CachedCard) => string | null | undefined
): DistributionBucket[] {
  const record: Record<string, number> = {};

  for (const entry of entries) {
    const zones = extractZones(zoneSelector(entry.card));
    if (zones.length === 0) {
      record.None = (record.None ?? 0) + entry.quantity;
      continue;
    }

    for (const zone of zones) {
      record[zone] = (record[zone] ?? 0) + entry.quantity;
    }
  }

  return toSortedBuckets(record);
}

export function useStatsSidebarModel() {
  const context = useDeckDetailsOptional();
  const { cards } = useCardData();
  const deck = context?.deck ?? null;
  const cardMap = useCardIdMap(cards);

  const mainEntries = useMemo(
    () => buildDeckEntriesFromQuantities(deck?.mainQuantities ?? {}, cardMap),
    [deck?.mainQuantities, cardMap]
  );

  const attackEntries = useMemo(
    () =>
      mainEntries.filter((entry) => formatUniversusCardType(entry.card.type) === "Attack"),
    [mainEntries]
  );

  const mainTotal = useMemo(
    () => mainEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    [mainEntries]
  );

  const attackCardsTotal = useMemo(
    () => attackEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    [attackEntries]
  );

  const typeDistribution = useMemo(() => {
    const record: Record<string, number> = {};

    for (const entry of mainEntries) {
      const type = formatUniversusCardType(entry.card.type) ?? entry.card.type ?? "Other";
      record[type] = (record[type] ?? 0) + entry.quantity;
    }

    return toSortedBuckets(record);
  }, [mainEntries]);

  const difficultyDistribution = useMemo(
    () => buildNumericDistribution(mainEntries, (card) => card.difficulty),
    [mainEntries]
  );

  const checkValueDistribution = useMemo(
    () => buildNumericDistribution(mainEntries, (card) => card.control),
    [mainEntries]
  );

  const blockModifierDistribution = useMemo(
    () => buildNumericDistribution(mainEntries, (card) => card.blockModifier),
    [mainEntries]
  );

  const blockZoneDistribution = useMemo(
    () => buildZoneDistribution(mainEntries, (card) => card.blockZone),
    [mainEntries]
  );

  const attackZoneDistribution = useMemo(
    () => buildZoneDistribution(attackEntries, (card) => card.attackZone),
    [attackEntries]
  );

  const attackSpeedDistribution = useMemo(
    () => buildNumericDistribution(attackEntries, (card) => card.speed),
    [attackEntries]
  );

  const attackDamageDistribution = useMemo(
    () => buildNumericDistribution(attackEntries, (card) => card.damage),
    [attackEntries]
  );

  return {
    deck,
    mainTotal,
    attackCardsTotal,
    typeDistribution,
    difficultyDistribution,
    checkValueDistribution,
    blockModifierDistribution,
    blockZoneDistribution,
    attackZoneDistribution,
    attackSpeedDistribution,
    attackDamageDistribution,
  };
}

export type StatsSidebarModel = ReturnType<typeof useStatsSidebarModel>;
