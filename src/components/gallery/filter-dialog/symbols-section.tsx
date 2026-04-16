import { useGalleryFilterDialogContext } from "./context";
import { SymbolsPickerPanel } from "./symbols-picker-panel";

export function SymbolsSection() {
  const { filters, meta, setBooleanFilter, toggleStringFilter } =
    useGalleryFilterDialogContext();

  const selectedSymbols = filters.symbols ?? [];
  const allSymbols = meta.uniqueValues?.symbols ?? [];
  const standardSymbols = allSymbols.filter(
    (symbol) => !symbol.startsWith("attuned:") && symbol !== "infinity"
  );
  const attunedSymbols = allSymbols.filter((symbol) => symbol.startsWith("attuned:"));

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Symbols</span>
      <SymbolsPickerPanel
        selectedSymbols={selectedSymbols}
        standardSymbols={standardSymbols}
        attunedSymbols={attunedSymbols}
        symbolMatchAll={filters.symbolMatchAll ?? false}
        onToggleSymbol={(symbol) => toggleStringFilter("symbols", symbol)}
        onInfinityChange={(checked) => {
          const hasInfinity = selectedSymbols.includes("infinity");
          if ((checked && !hasInfinity) || (!checked && hasInfinity)) {
            toggleStringFilter("symbols", "infinity");
          }
        }}
        onSymbolMatchAllChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
      />
    </div>
  );
}
