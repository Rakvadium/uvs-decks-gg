"use client"

import { PageType } from "@/app/(app)/layout"
import { DecksMobileTopBar } from "@/components/decks/decks-view/mobile-top-bar"
import { GalleryTopBarFilters } from "@/components/gallery/gallery-top-bar-filters"
import { SlotRenderer, useShellSlotSlots } from "./shell-slot-provider"

interface MobileTopBarProps {
  pageType?: PageType | null
}

const mobileTopBarClassName = "relative shrink-0 bg-background pt-3"

const galleryMobileTopBarClassName =
  "relative shrink-0 border-b border-primary/40 bg-primary/15 pt-3 shadow-[0_1px_0_color-mix(in_oklch,var(--primary)_12%,transparent)] dark:border-sidebar-border/50 dark:bg-sidebar dark:shadow-none"

export function MobileTopBar({ pageType }: MobileTopBarProps) {
  const slots = useShellSlotSlots()
  const hasTopBarSlots = (slots.get("top-bar")?.length ?? 0) > 0

  if (pageType === "gallery") {
    return (
      <div className={galleryMobileTopBarClassName}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 dark:hidden" />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{ background: "var(--chrome-shell-sidebar-wash)" }}
        />
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

  if (pageType === "deckDetails") {
    return null
  }

  if (pageType === "community" && hasTopBarSlots) {
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
