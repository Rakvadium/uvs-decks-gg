import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SymbolBadge, SymbolIcon } from "@/components/universus/symbol-icon";
import { cn } from "@/lib/utils";
import { useActiveDeckCharacterPanelContext } from "./context";

export function ActiveDeckCharacterSymbolSelector() {
  const {
    characterSymbols,
    selectedSymbol,
    setSymbolOpen,
    symbolOpen,
    handleSelectSymbol,
    startingCharacter,
  } = useActiveDeckCharacterPanelContext();

  if (!startingCharacter || characterSymbols.length === 0) return null;

  return (
    <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change symbol"
          className={cn(
            "absolute -bottom-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-background/80",
            "transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_12px_-6px_var(--primary)]"
          )}
        >
          <SymbolIcon symbol={selectedSymbol ?? characterSymbols[0]} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="flex items-center gap-2">
          {characterSymbols.map((symbol) => (
            <SymbolBadge
              key={symbol}
              symbol={symbol}
              selected={selectedSymbol === symbol}
              onClick={() => handleSelectSymbol(symbol)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
