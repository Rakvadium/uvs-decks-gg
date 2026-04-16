"use client";

import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator"
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { cn } from "@/lib/utils";

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
        shape === "circle" ? "rounded-full" : "rounded-xs",
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
    <div className="mx-auto grid w-fit grid-cols-6 justify-items-center gap-3">
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

export interface SymbolsPickerPanelProps {
  selectedSymbols: string[];
  standardSymbols: string[];
  attunedSymbols: string[];
  symbolMatchAll: boolean;
  onToggleSymbol: (symbol: string) => void;
  onInfinityChange: (checked: boolean) => void;
  onSymbolMatchAllChange: (checked: boolean) => void;
  plain?: boolean;
}

export function SymbolsPickerPanel({
  selectedSymbols,
  standardSymbols,
  attunedSymbols,
  symbolMatchAll,
  onToggleSymbol,
  onInfinityChange,
  onSymbolMatchAllChange,
  plain = false,
}: SymbolsPickerPanelProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        !plain && "rounded-lg border p-3 border-border/50 bg-card/30 backdrop-blur-sm"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={selectedSymbols.includes("infinity")}
            onCheckedChange={onInfinityChange}
          />
          <Label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Infinity
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={symbolMatchAll} onCheckedChange={onSymbolMatchAllChange} />
          <Label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Match All
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-1">
        <div className="space-y-2 mt-4">
          {!plain ? (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Standard
            </span>
          ) : null}
          <SymbolGrid
            symbols={standardSymbols}
            selectedSymbols={selectedSymbols}
            shape="circle"
            onToggle={onToggleSymbol}
          />
        </div>
        <Separator />
        <div className="space-y-2 mt-2">
          {!plain ? (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Attuned
            </span>
          ) : null}
          <SymbolGrid
            symbols={attunedSymbols}
            selectedSymbols={selectedSymbols}
            shape="square"
            onToggle={onToggleSymbol}
          />
        </div>
      </div>
    </div>
  );
}
