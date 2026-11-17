import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  /** `corner`: a tab on the card art (hero). `inline`: a labeled button in a control row (sidebar). */
  layout?: "corner" | "inline";
}

/** "infinity" -> "Infinity" for the inline label. */
export function formatSymbolName(symbol: string) {
  return symbol.charAt(0).toUpperCase() + symbol.slice(1);
}

/** Identity symbol corner button + popover (hero and sidebar share the same markup). */
export function UvsSetupSymbolSelector({
  characterSymbols,
  selectedSymbol,
  open,
  onOpenChange,
  onSelectSymbol,
  layout = "corner",
}: UvsSetupSymbolSelectorProps) {
  if (characterSymbols.length === 0) return null;
  const current = selectedSymbol ?? characterSymbols[0];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {layout === "inline" ? (
          <Button type="button" variant="outline" size="xs" aria-label={`Symbol: ${formatSymbolName(current)}. Change symbol`}>
            <SymbolIcon symbol={current} size="sm" />
            {formatSymbolName(current)}
            <ChevronDown className="text-muted-foreground" />
          </Button>
        ) : (
        <button
          type="button"
          aria-label="Change symbol"
          className={cn(
            "absolute bottom-0 left-0 z-20 flex h-9 w-9 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "rounded-tab-tr",
            "bg-background/80 backdrop-blur-sm",
            "border-r border-t border-border/40",
            "transition-colors hover:bg-primary/10 hover:border-primary/40"
          )}
        >
          <SymbolIcon symbol={current} size="lg" />
        </button>
        )}
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
