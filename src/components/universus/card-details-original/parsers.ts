import { KEYWORD_ABILITY_MAP } from "./constants";

const ZONE_CONFIG: Record<
  string,
  { label: string; textColor: string; borderColor: string; bgColor: string }
> = {
  H: {
    label: "High",
    textColor: "text-red-500",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
  },
  M: {
    label: "Mid",
    textColor: "text-orange-500",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/10",
  },
  L: {
    label: "Low",
    textColor: "text-yellow-500",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
  },
  high: {
    label: "High",
    textColor: "text-red-500",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
  },
  mid: {
    label: "Mid",
    textColor: "text-orange-500",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/10",
  },
  low: {
    label: "Low",
    textColor: "text-yellow-500",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
  },
};

export type ZoneDisplay = {
  label: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
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
