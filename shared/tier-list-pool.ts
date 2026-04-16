export const TIER_LIST_POOL_ALL_TYPES = "*";

export type TierListPoolScope = {
  setCode: string;
  cardType: string;
};

export function normalizeTierListPoolScopes(scopes: TierListPoolScope[]): TierListPoolScope[] {
  const seen = new Set<string>();
  const out: TierListPoolScope[] = [];
  for (const scope of scopes) {
    const setCode = scope.setCode.trim();
    const cardType = scope.cardType.trim();
    if (!setCode || !cardType) {
      continue;
    }
    const key = `${setCode}::${cardType}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ setCode, cardType });
  }
  return out;
}

export function tierListPoolScopeKey(scope: TierListPoolScope) {
  return `${scope.setCode}::${scope.cardType}`;
}
