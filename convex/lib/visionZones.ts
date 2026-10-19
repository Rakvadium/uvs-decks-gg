type Zone = "high" | "mid" | "low";

/**
 * Applies pixel-detected zones to an OCR result. The detector samples fixed card regions, so its
 * attack zone is noise on non-attacks and Characters never have a block shield.
 * When OCR could not read the type, zones are kept for the reviewer to confirm.
 */
export function applyRegionZones<T extends { type?: string; attackZone?: string; blockZone?: string }>(
  result: T,
  zones: { attackZone?: Zone; blockZone?: Zone },
): T {
  const type = result.type?.trim().toLowerCase();
  if (zones.attackZone && (!type || type === "attack")) result.attackZone = zones.attackZone;
  if (zones.blockZone && type !== "character") result.blockZone = zones.blockZone;
  return result;
}
