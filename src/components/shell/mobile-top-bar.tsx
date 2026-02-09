"use client"

import { PageType } from "@/app/(app)/layout"
import { GalleryTopBarFilters } from "@/components/gallery/gallery-header"

interface MobileTopBarProps {
  pageType?: PageType | null
}

export function MobileTopBar({ pageType }: MobileTopBarProps) {
  if (pageType === "gallery") {
    return (
      <div className="relative shrink-0 border-t border-primary/20 bg-background/95 backdrop-blur-lg">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="px-4 py-3">
          <GalleryTopBarFilters />
        </div>
      </div>
    )
  }

  return null
}
