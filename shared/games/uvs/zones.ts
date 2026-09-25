import type { ZoneTone } from "../deck";

/** Rank of a UVS zone string by its first letter: low 0, mid 1, high 2; otherwise null. */
export function zoneRank(zone?: string | null): number | null {
  if (!zone) return null;
  const normalized = zone.toLowerCase();
  if (normalized.startsWith("l")) return 0;
  if (normalized.startsWith("m")) return 1;
  if (normalized.startsWith("h")) return 2;
  return null;
}

export function getZoneTone(zone?: string | null): ZoneTone | null {
  const value = zoneRank(zone);
  if (value === 0) return "low";
  if (value === 1) return "mid";
  if (value === 2) return "high";
  return null;
}

/** Splits a raw zone string (e.g. "High/Mid") into unique "High" / "Mid" / "Low" labels, first-seen order. */
export function extractZones(rawZone?: string | null): string[] {
  if (!rawZone) return [];
  const tokens = rawZone
    .toLowerCase()
    .split(/[\s,/|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const zones = new Set<string>();
  for (const token of tokens) {
    if (token.startsWith("h")) zones.add("High");
    if (token.startsWith("m")) zones.add("Mid");
    if (token.startsWith("l")) zones.add("Low");
  }
  return Array.from(zones);
}
