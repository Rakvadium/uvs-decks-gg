"use client";

import { useMemo, useState } from "react";
import { CYBERPUNK_LEGEND_COUNT, normalizeCyberpunkSetup } from "@shared/games/cyberpunk/setup";
import { Kicker } from "@/components/ui/typography-headings";
import type { GameDeckSetupPanelProps } from "@/games/types";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { CardDetailsDialog } from "../card-details/dialog";
import { LegendAvatar } from "./legend-art";
import { LegendPickerDialog } from "./legend-picker-dialog";
import { LegendSlot } from "./legend-slot";
import { RamBudgetSummary } from "./ram-budget-summary";

const SLOT_INDEXES = Array.from({ length: CYBERPUNK_LEGEND_COUNT }, (_, index) => index);

function useLegendSlots({ setup, getCard }: Pick<GameDeckSetupPanelProps, "setup" | "getCard">) {
  // Keyed by content: `normalizeSetup` returns a fresh array every render.
  const legendKey = normalizeCyberpunkSetup({ setup }).legendIds.join("|");
  const legendIds = useMemo(() => (legendKey ? legendKey.split("|") : []), [legendKey]);
  const slots = useMemo(
    () => SLOT_INDEXES.map((index) => (legendIds[index] ? getCard(legendIds[index]) ?? null : null)),
    [legendIds, getCard]
  );
  const legends = useMemo(() => slots.filter((card): card is CachedCard => Boolean(card)), [slots]);
  return { legendIds, slots, legends };
}

/** Compact (deck tiles): the chosen Legends as overlapping color-ringed avatars. */
function CyberpunkDeckSetupCompact({ setup, getCard, className }: GameDeckSetupPanelProps) {
  const { legends } = useLegendSlots({ setup, getCard });
  if (legends.length === 0) return null;
  return (
    <span className={cn("inline-flex items-center -space-x-1.5", className)} aria-label="Legends">
      {legends.map((legend) => (
        <LegendAvatar key={legend._id} card={legend} />
      ))}
    </span>
  );
}

/**
 * Hero (deck details column) and sidebar (active deck) Legend editor: 3 slots, the Legend picker,
 * and the RAM budget per color.
 */
function CyberpunkDeckSetupEditor({
  variant,
  setup,
  getCard,
  onChange,
  readOnly,
  mainQuantities,
  deckDescription,
  overlay,
  className,
}: GameDeckSetupPanelProps) {
  const { legendIds, slots, legends } = useLegendSlots({ setup, getCard });
  const editable = !readOnly && Boolean(onChange);
  const [picker, setPicker] = useState<{ open: boolean; slotIndex: number | null }>({ open: false, slotIndex: null });
  const [detailsCard, setDetailsCard] = useState<CachedCard | null>(null);
  const isHero = variant === "hero";

  const openPicker = (index: number | null) => {
    if (editable) setPicker({ open: true, slotIndex: index !== null && index < legendIds.length ? index : null });
  };
  const removeLegend = (index: number) => {
    void onChange?.({ game: "cyberpunk", legendIds: legendIds.filter((_, i) => i !== index) as Id<"cards">[] });
  };

  return (
    <>
      <section
        aria-label="Legends"
        className={cn(
          "relative space-y-3 rounded-lg border border-border/50 bg-card/50 p-3",
          isHero && "mx-auto w-full max-w-[260px] shrink-0 lg:mx-0 lg:w-48",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 pr-14">
          <Kicker size="sm" tone="foreground" className="font-semibold">
            Legends{" "}
            <span className="font-normal normal-case tracking-normal tabular-nums text-muted-foreground">
              {legendIds.length}/{CYBERPUNK_LEGEND_COUNT}
            </span>
          </Kicker>
        </div>
        {overlay}

        {!isHero && deckDescription?.trim() ? (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{deckDescription}</p>
        ) : null}

        <div className={cn(isHero ? "space-y-1.5" : "grid grid-cols-3 gap-2")}>
          {SLOT_INDEXES.map((index) => (
            <LegendSlot
              key={index}
              index={index}
              card={slots[index]}
              editable={editable}
              layout={isHero ? "row" : "tile"}
              onPick={openPicker}
              onRemove={removeLegend}
              onOpenCard={setDetailsCard}
            />
          ))}
        </div>

        <RamBudgetSummary
          legends={legends}
          mainQuantities={mainQuantities}
          getCard={getCard}
          className="border-t border-border/40 pt-3"
        />
      </section>

      {editable && onChange ? (
        <LegendPickerDialog
          open={picker.open}
          onOpenChange={(open) => setPicker((prev) => ({ ...prev, open }))}
          setup={setup}
          onChange={onChange}
          slotIndex={picker.slotIndex}
        />
      ) : null}

      <CardDetailsDialog
        card={detailsCard}
        open={detailsCard !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsCard(null);
        }}
        cards={legends}
      />
    </>
  );
}

/** Cyberpunk deck setup panel (`ClientGameUi.DeckSetupPanel`). */
export function CyberpunkDeckSetupPanel(props: GameDeckSetupPanelProps) {
  if (props.variant === "compact") return <CyberpunkDeckSetupCompact {...props} />;
  return <CyberpunkDeckSetupEditor {...props} />;
}
