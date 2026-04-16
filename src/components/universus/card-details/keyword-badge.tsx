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
          className="inline-flex cursor-pointer items-center rounded-sm px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-[0.12em] transition-all hover:scale-105"
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
