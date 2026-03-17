import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SymbolBadge, SymbolIcon } from "@/components/universus/symbol-icon";
import { cn } from "@/lib/utils";
import { useDeckDetailsHeroPanelContext } from "./context";

export function DeckDetailsHeroSymbolSelector() {
  const {
    startingCharacter,
    characterSymbols,
    selectedSymbol,
    symbolOpen,
    setSymbolOpen,
    handleSelectSymbol,
  } = useDeckDetailsHeroPanelContext();

  if (!startingCharacter || characterSymbols.length === 0) return null;

  return (
    <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change symbol"
          className={cn(
            "absolute bottom-0 left-0 z-20 flex h-9 w-9 items-center justify-center",
            "rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none",
            "bg-background/80 backdrop-blur-sm",
            "border-r border-t border-border/40",
            "transition-all hover:bg-primary/10 hover:border-primary/40"
          )}
        >
          <SymbolIcon symbol={selectedSymbol ?? characterSymbols[0]} size="lg" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
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
