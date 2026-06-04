"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DeckFormatLegalityBadgeProps = {
  deckId: Id<"decks">;
  formatKey?: string | null;
  subFormat?: string;
  className?: string;
  compact?: boolean;
};

export function DeckFormatLegalityBadge({
  deckId,
  formatKey,
  subFormat,
  className,
  compact,
}: DeckFormatLegalityBadgeProps) {
  const formatDoc = useQuery(api.formats.getByKey, formatKey ? { key: formatKey } : "skip");
  const validation = useQuery(api.deckValidation.validateDeck, { deckId });

  const formatLabel = !formatKey?.trim()
    ? "No format"
    : formatDoc === undefined
      ? formatKey
      : (formatDoc?.name ?? formatKey);
  const label = subFormat && formatKey?.trim() ? `${formatLabel} / ${subFormat}` : formatLabel;

  if (validation === undefined) {
    return (
      <Badge variant="outline" className={cn(compact ? "h-8 text-[9px]" : "text-[10px]", className)}>
        {label}
      </Badge>
    );
  }

  const issueLines = [
    ...validation.errors.map((e) => e.message),
    ...validation.warnings.map((w) => w.message),
  ];
  const showTooltip = issueLines.length > 0;
  const variant =
    !validation.isValid ? "destructive" : validation.warnings.length > 0 ? "outline" : "cyber";

  const badge = (
    <Badge variant={variant} className={cn("cursor-default", compact ? "h-8 text-[9px]" : "text-[10px]", className)}>
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        <ul className="list-inside list-disc space-y-1 text-left text-xs">
          {issueLines.map((line, i) => (
            <li key={`${line}-${i}`}>{line}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
