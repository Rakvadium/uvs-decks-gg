import { cn } from "@/lib/utils";
import {
  VARIANT_LABELS,
  useCardDetailsVariant,
  type CardDetailsVariant,
} from "./use-card-details-variant";

const VARIANTS = Object.keys(VARIANT_LABELS) as CardDetailsVariant[];

export function VariantSelector() {
  const { variant, setVariant } = useCardDetailsVariant();

  return (
    <div className="flex items-center gap-1">
      {VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setVariant(v)}
          className={cn(
            "px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-all rounded-sm",
            variant === v
              ? "bg-primary/20 text-primary border border-primary/40"
              : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 border border-transparent"
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
