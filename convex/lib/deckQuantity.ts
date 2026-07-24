export function requirePositiveIntegerQuantity(
  quantity: number | undefined,
  fallback = 1,
): number {
  const value = quantity ?? fallback;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Quantity must be a positive integer");
  }
  return value;
}
