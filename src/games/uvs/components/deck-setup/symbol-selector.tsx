import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SymbolBadge } from "../symbol-icon/symbol-badge";
import { SymbolIcon } from "../symbol-icon/symbol-icon";

interface UvsSetupSymbolSelectorProps {
  characterSymbols: string[];
  selectedSymbol: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSymbol: (symbol: string) => void;
}

/** Identity symbol corner button + popover (hero and sidebar share the same markup). */
export function UvsSetupSymbolSelector({
  characterSymbols,
  selectedSymbol,
  open,
  onOpenChange,
  onSelectSymbol,
}: UvsSetupSymbolSelectorProps) {
  if (characterSymbols.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change symbol"
          className={cn(
            "absolute bottom-0 left-0 z-20 flex h-9 w-9 items-center justify-center",
            "rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none",
            "bg-background/80 backdrop-blur-sm",
            "border-r border-t border-border/40",
            "transition-colors hover:bg-primary/10 hover:border-primary/40"
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
              onClick={() => onSelectSymbol(symbol)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
