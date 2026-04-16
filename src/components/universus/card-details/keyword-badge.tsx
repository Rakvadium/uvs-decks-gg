import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KEYWORD_ABILITY_MAP, TIMING_COLORS } from "./constants";

const keywordChipClassName =
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-[0.12em]";

interface KeywordBadgeProps {
  keyword: string;
}

export function KeywordBadge({ keyword }: KeywordBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const keywordName = keyword.replace(/[:\s]+\d+$/, "").trim();
  const abilityDef = KEYWORD_ABILITY_MAP.get(keywordName.toLowerCase());

  if (!abilityDef || !abilityDef.timing) {
    return (
      <span
        className={cn(keywordChipClassName, "border-border/40 bg-muted/10 text-foreground/90")}
      >
        {keyword}
      </span>
    );
  }

  const color = TIMING_COLORS[abilityDef.timing];

  return (
    <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen} delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(keywordChipClassName, "cursor-pointer transition-all hover:scale-105")}
          style={{
            backgroundColor: `${color}20`,
            color,
            border: `1px solid ${color}40`,
          }}
          onFocus={(event) => event.preventDefault()}
        >
          {keyword}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-background/90 backdrop-blur-md"
        style={{
          borderColor: `${color}40`,
        }}
        onPointerDownOutside={() => setTooltipOpen(false)}
      >
        <p className="text-sm font-mono text-foreground">{abilityDef.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
