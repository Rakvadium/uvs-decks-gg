import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SymbolBadge } from "@/components/universus/symbol-icon";
import { useGalleryFilterDialogContext } from "./context";

function SymbolGrid({
  symbols,
  selectedSymbols,
  onToggle,
}: {
  symbols: string[];
  selectedSymbols: string[];
  onToggle: (symbol: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-6 md:gap-1.5">
      {symbols.map((symbol) => (
        <SymbolBadge
          key={symbol}
          symbol={symbol}
          selected={selectedSymbols.includes(symbol)}
          onClick={() => onToggle(symbol)}
          size="sm"
        />
      ))}
    </div>
  );
}

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
      <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={selectedSymbols.includes("infinity")}
              onCheckedChange={(checked) => {
                const hasInfinity = selectedSymbols.includes("infinity");
                if ((checked && !hasInfinity) || (!checked && hasInfinity)) {
                  toggleStringFilter("symbols", "infinity");
                }
              }}
            />
            <Label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Infinity
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.symbolMatchAll ?? false}
              onCheckedChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
            />
            <Label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Match All
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Standard
            </span>
            <SymbolGrid
              symbols={standardSymbols}
              selectedSymbols={selectedSymbols}
              onToggle={(symbol) => toggleStringFilter("symbols", symbol)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Attuned
            </span>
            <SymbolGrid
              symbols={attunedSymbols}
              selectedSymbols={selectedSymbols}
              onToggle={(symbol) => toggleStringFilter("symbols", symbol)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
