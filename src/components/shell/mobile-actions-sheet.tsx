"use client"

import { useMobileShell } from "./mobile-shell-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChevronLeft, X } from "lucide-react"
import { useShellSlot } from "./shell-slot-provider"

export function MobileActionsSheet() {
  const { isActionsSheetOpen, setActionsSheetOpen } = useMobileShell()
  const { state, actions } = useShellSlot()
  const sidebarSlots = state.slots.get("right-sidebar") ?? []
  const activeActionId = state.activeSidebarActionId

  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId)
  const ActiveComponent = activeSlot?.component
  const ActiveHeader = activeSlot?.header
  const ActiveFooter = activeSlot?.footer

  const handleClose = () => {
    setActionsSheetOpen(false)
    actions.setActiveSidebarAction(null)
  }

  const handleBack = () => {
    actions.setActiveSidebarAction(null)
  }

  if (sidebarSlots.length === 0) {
    return null
  }

  return (
    <Sheet open={isActionsSheetOpen} onOpenChange={(open) => {
      if (!open) handleClose()
      else setActionsSheetOpen(true)
    }}>
      <SheetContent 
        side="bottom" 
        className="!h-auto !max-h-[100dvh] overflow-hidden p-0" 
        showCloseButton={false}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
            <div className="flex flex-1 items-center gap-2 min-w-0">
              {activeSlot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {ActiveHeader ? (
                <ActiveHeader />
              ) : (
                <SheetTitle className="text-left">
                  {activeSlot ? activeSlot.label ?? activeSlot.id : "Actions"}
                </SheetTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {ActiveComponent ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ActiveComponent />
              </div>
              {ActiveFooter && (
                <div className="shrink-0 border-t bg-background px-4 py-3">
                  <ActiveFooter />
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {sidebarSlots.map((slot) => {
                  const Icon = slot.icon
                  const label = slot.label ?? slot.id
                  return (
                  <button
                    key={slot.id}
                    onClick={() => actions.setActiveSidebarAction(slot.id)}
                    className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="text-sm font-semibold">{label.slice(0, 1)}</span>}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                )})}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
