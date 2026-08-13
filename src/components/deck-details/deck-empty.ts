export function quantityTotal(quantities: Record<string, number> | undefined) {
  if (!quantities) return 0;
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

export function isDeckQuantitiesEmpty(deck: {
  mainQuantities: Record<string, number>;
  sideQuantities: Record<string, number>;
  referenceQuantities: Record<string, number>;
} | null | undefined) {
  if (!deck) return true;
  return (
    quantityTotal(deck.mainQuantities) +
      quantityTotal(deck.sideQuantities) +
      quantityTotal(deck.referenceQuantities) ===
    0
  );
}
