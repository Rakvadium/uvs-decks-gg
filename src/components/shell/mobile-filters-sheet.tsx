"use client"

import { useState, ReactNode } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface MobileFiltersSheetProps {
  children: ReactNode
  title?: string
  onApply?: () => void
  onClear?: () => void
  showClearButton?: boolean
}

export function MobileFiltersSheet({
  children,
  title = "Filters",
  onApply,
  onClear,
  showClearButton = true,
}: MobileFiltersSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    onApply?.()
    setIsOpen(false)
  }

  const handleClear = () => {
    onClear?.()
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="h-4 w-4" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col p-0"
          showCloseButton={false}
        >
          <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
            <SheetTitle>{title}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {children}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t bg-background p-4">
            {showClearButton && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClear}
              >
                Clear All
              </Button>
            )}
            <Button className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface MobileFiltersButtonProps {
  onClick: () => void
}

export function MobileFiltersButton({ onClick }: MobileFiltersButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0"
      onClick={onClick}
    >
      <Filter className="h-4 w-4" />
    </Button>
  )
}
