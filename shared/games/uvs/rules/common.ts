// Generic helpers moved to `shared/games/rules-common.ts`; re-exported for existing imports.
export {
  buildLegalityMap,
  checkSideboardRule,
  effectivePerCardCopyLimit,
  groupEffectiveCopyLimit,
  legalityApplies,
  positiveQuantityIds,
  sumQuantityValues,
  type SideboardMessages,
} from "../../rules-common";

export function isCharacterCardType(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return t === "Character";
}
