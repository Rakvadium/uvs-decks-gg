"use client"

import { PageType } from "@/app/(app)/layout"
import { DecksMobileTopBar } from "@/components/decks/decks-view/mobile-top-bar"
import { GalleryTopBarFilters } from "@/components/gallery/gallery-header"
import { SlotRenderer, useShellSlot } from "./shell-slot-provider"

interface MobileTopBarProps {
  pageType?: PageType | null
}

const mobileTopBarClassName = "relative shrink-0 bg-background"

export function MobileTopBar({ pageType }: MobileTopBarProps) {
  const { state } = useShellSlot()
  const hasTopBarSlots = (state.slots.get("top-bar")?.length ?? 0) > 0

  if (pageType === "gallery") {
    return (
      <div className={mobileTopBarClassName}>
        <div className="relative px-4 py-3">
          <GalleryTopBarFilters />
        </div>
      </div>
    )
  }

  if (pageType === "decks") {
    return (
      <div className={mobileTopBarClassName}>
        <div className="relative px-4 py-3">
          <DecksMobileTopBar />
        </div>
      </div>
    )
  }

  if (pageType === "deckDetails" && hasTopBarSlots) {
    return (
      <div className={mobileTopBarClassName}>
        <div className="relative px-4 py-3">
          <SlotRenderer area="top-bar" />
        </div>
      </div>
    )
  }

  return null
}
