import { UNIVERSUS_COLORS } from "@/config/universus";
import { KEYWORD_ABILITY_MAP } from "./constants";

const ZONE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  H: {
    label: "High",
    color: UNIVERSUS_COLORS.HIGH,
  },
  M: {
    label: "Mid",
    color: UNIVERSUS_COLORS.MID,
  },
  L: {
    label: "Low",
    color: UNIVERSUS_COLORS.LOW,
  },
  high: {
    label: "High",
    color: UNIVERSUS_COLORS.HIGH,
  },
  mid: {
    label: "Mid",
    color: UNIVERSUS_COLORS.MID,
  },
  low: {
    label: "Low",
    color: UNIVERSUS_COLORS.LOW,
  },
};

export type ZoneDisplay = {
  label: string;
  color: string;
};

export function parseSymbols(symbols?: string) {
  if (!symbols) return [];

  const rawSymbols = symbols
    .split(/[,|]/)
    .map((symbol) => symbol.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(rawSymbols)];
}

export function parseKeywords(keywords?: string) {
  if (!keywords) return [];

  return keywords
    .split(/[,|]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function splitKeywordGroups(keywords: string[]) {
  const keywordAbilities: string[] = [];
  const otherKeywords: string[] = [];

  keywords.forEach((keyword) => {
    const keywordName = keyword.replace(/[:\s]+\d+$/, "").trim();

    if (KEYWORD_ABILITY_MAP.has(keywordName.toLowerCase())) {
      keywordAbilities.push(keyword);
      return;
    }

    otherKeywords.push(keyword);
  });

  keywordAbilities.sort((a, b) => a.localeCompare(b));
  otherKeywords.sort((a, b) => a.localeCompare(b));

  return { keywordAbilities, otherKeywords };
}

export function parseZoneDisplay(zone?: string): ZoneDisplay[] {
  if (!zone) return [];

  const normalizedZone = zone.toLowerCase().trim();
  const zoneParts =
    normalizedZone.includes(" ") || normalizedZone.includes("/") || normalizedZone.includes(",")
      ? normalizedZone.split(/[\s\/,]+/).filter(Boolean)
      : normalizedZone.length <= 3
        ? normalizedZone.split("").map((value) => value.toUpperCase())
        : [normalizedZone];

  return zoneParts
    .map((value) => ZONE_CONFIG[value] || ZONE_CONFIG[value.toUpperCase()])
    .filter(Boolean);
}
