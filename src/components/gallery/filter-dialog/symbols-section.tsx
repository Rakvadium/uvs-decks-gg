import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";

function SymbolButton({
  symbol,
  selected,
  shape,
  onClick,
}: {
  symbol: string;
  selected: boolean;
  shape: "circle" | "square";
  onClick: () => void;
}) {
  const path = getSymbolPath(symbol);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={symbol}
      className={cn(
        "relative h-8 w-8 overflow-hidden border border-border/60 bg-background p-0 transition-colors hover:bg-muted",
        shape === "circle" ? "rounded-full" : "rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}
    >
      {path ? (
        <Image src={path} alt={symbol} width={32} height={32} className="h-full w-full object-contain" />
      ) : (
        <span className="text-xs">{symbol}</span>
      )}
    </button>
  );
}

function SymbolGrid({
  symbols,
  selectedSymbols,
  shape,
  onToggle,
}: {
  symbols: string[];
  selectedSymbols: string[];
  shape: "circle" | "square";
  onToggle: (symbol: string) => void;
}) {
  return (
    <div className="mx-auto grid w-fit grid-cols-6 justify-items-center gap-1.5">
      {symbols.map((symbol) => {
        const selected = selectedSymbols.includes(symbol);

        return (
          <SymbolButton
            key={symbol}
            symbol={symbol}
            selected={selected}
            shape={shape}
            onClick={() => onToggle(symbol)}
          />
        );
      })}
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
              shape="circle"
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
              shape="square"
              onToggle={(symbol) => toggleStringFilter("symbols", symbol)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
