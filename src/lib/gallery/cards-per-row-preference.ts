export function parseStoredCardsPerRow(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

export function resolveGalleryCardsPerRowPreference(input: {
  single?: number;
  open?: number;
  closed?: number;
}): number | undefined {
  if (typeof input.single === "number" && !Number.isNaN(input.single)) {
    return input.single;
  }
  if (typeof input.closed === "number" && !Number.isNaN(input.closed)) {
    return input.closed;
  }
  if (typeof input.open === "number" && !Number.isNaN(input.open)) {
    return input.open;
  }
  return undefined;
}

export function clampGalleryCardsPerRow(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = typeof value === "number" ? value : fallback;
  if (Number.isNaN(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}
