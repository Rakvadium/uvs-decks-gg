"use client"

import { PageType } from "@/app/(app)/layout"
import { DecksMobileTopBar } from "@/components/decks/decks-view/mobile-top-bar"
import { GalleryTopBarFilters } from "@/components/gallery/gallery-top-bar-filters"
import { cn } from "@/lib/utils"
import { SlotRenderer, useShellSlotSlots } from "./shell-slot-provider"
import { useDecksOptional } from "@/providers/DecksProvider"
import {
  SHELL_CHROME_EDGE_BOTTOM,
  SHELL_CHROME_SURFACE,
  SHELL_CHROME_WASH_STYLE,
} from "./shell-chrome"

interface MobileTopBarProps {
  pageType?: PageType | null
}

const mobileChromeBarClassName = cn(
  "shrink-0",
  SHELL_CHROME_SURFACE,
  SHELL_CHROME_EDGE_BOTTOM
)

export function MobileTopBar({ pageType }: MobileTopBarProps) {
  const slots = useShellSlotSlots()
  const hasTopBarSlots = (slots.get("top-bar")?.length ?? 0) > 0
  const decksContext = useDecksOptional()

  if (pageType === "gallery") {
    return (
      <div className={mobileChromeBarClassName}>
        <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />
        <div className="relative px-4 py-1.5">
          <GalleryTopBarFilters />
        </div>
      </div>
    )
  }

  if (pageType === "decks") {
    if (!decksContext) {
      return null
    }
    return (
      <div className={mobileChromeBarClassName}>
        <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />
        <div className="relative px-4 py-1.5">
          <DecksMobileTopBar />
        </div>
      </div>
    )
  }

  if (pageType === "deckDetails") {
    return null
  }

  if (pageType === "community" && hasTopBarSlots) {
    return (
      <div className={mobileChromeBarClassName}>
        <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />
        <div className="relative px-4 py-1.5">
          <SlotRenderer area="top-bar" />
        </div>
      </div>
    )
  }

  return null
}
