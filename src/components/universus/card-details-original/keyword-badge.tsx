import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KEYWORD_ABILITY_MAP, TIMING_COLORS } from "./constants";

interface KeywordBadgeProps {
  keyword: string;
}

export function KeywordBadge({ keyword }: KeywordBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const keywordName = keyword.replace(/[:\s]+\d+$/, "").trim();
  const abilityDef = KEYWORD_ABILITY_MAP.get(keywordName.toLowerCase());

  if (!abilityDef || !abilityDef.timing) {
    return (
      <Badge variant="outline" className="text-xs">
        {keyword}
      </Badge>
    );
  }

  const color = TIMING_COLORS[abilityDef.timing];

  return (
    <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen} delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-block cursor-pointer px-2.5 py-0.5 text-xs font-semibold font-mono uppercase tracking-widest transition-all hover:scale-105"
          style={{
            borderLeft: `2px solid ${color}`,
            borderTop: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            borderBottom: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            borderRight: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
            background: `linear-gradient(to right, ${color}35, ${color}10)`,
            color,
          }}
          onFocus={(event) => event.preventDefault()}
        >
          {keyword}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs border-l-2 bg-background/80 backdrop-blur-md"
        style={{
          borderLeftColor: color,
          boxShadow: `0 0 20px ${color}20`,
        }}
        onPointerDownOutside={() => setTooltipOpen(false)}
      >
        <p className="text-sm font-mono text-foreground">{abilityDef.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
