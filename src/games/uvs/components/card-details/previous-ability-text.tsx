"use client";

import { useQuery } from "convex/react";
import { ChevronDown } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AbilityText } from "./ability-text";

export function PreviousAbilityText({ cardId }: { cardId: Id<"cards"> }) {
  const history = useQuery(api.cards.listTextHistory, { cardId });

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground [&[data-state=open]_svg]:rotate-180">
        <span className="chrome-label-case">Previous text</span>
        <ChevronDown className="size-3.5 shrink-0 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        {history.map((entry, index) => (
          <div
            key={entry._id}
            className="rounded-lg border border-border/40 bg-muted/20 p-3"
          >
            {history.length > 1 ? (
              <p className="chrome-label-case mb-2 text-[10px] text-muted-foreground/70">
                {index === 0 ? "Most recent" : `Older version ${index + 1}`}
              </p>
            ) : (
              <p className="chrome-label-case mb-2 text-[10px] text-muted-foreground/70">
                Printed / prior rules text
              </p>
            )}
            <AbilityText text={entry.text} showHeading={false} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
