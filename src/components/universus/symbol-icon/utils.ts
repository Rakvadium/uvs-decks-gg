import { ATTUNED_SYMBOL_MAP, SYMBOL_BASE_PATH, SYMBOL_MAP } from "./constants";

export function getSymbolPath(symbol: string): string | null {
  const normalizedSymbol = symbol.toLowerCase().trim();

  if (normalizedSymbol.startsWith("attuned:") || normalizedSymbol.startsWith("attuned-")) {
    const baseSymbol = normalizedSymbol.replace(/^attuned[:-]/, "");
    const filename = ATTUNED_SYMBOL_MAP[baseSymbol];
    return filename ? `${SYMBOL_BASE_PATH}/${filename}` : null;
  }

  const filename = SYMBOL_MAP[normalizedSymbol];
  return filename ? `${SYMBOL_BASE_PATH}/${filename}` : null;
}

export function isValidSymbol(symbol: string): boolean {
  return getSymbolPath(symbol) !== null;
}
