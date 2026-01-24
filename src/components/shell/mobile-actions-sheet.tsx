"use client"

import { useState } from "react"
import { useMobileShell } from "./mobile-shell-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SidebarAction } from "@/app/(app)/layout"
import { ChevronLeft, X } from "lucide-react"

interface MobileActionsSheetProps {
  actions: SidebarAction[]
}

export function MobileActionsSheet({ actions }: MobileActionsSheetProps) {
  const { isActionsSheetOpen, setActionsSheetOpen } = useMobileShell()
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  const activeAction = actions.find((a) => a.id === activeActionId)

  const handleClose = () => {
    setActionsSheetOpen(false)
    setActiveActionId(null)
  }

  const handleBack = () => {
    setActiveActionId(null)
  }

  if (actions.length === 0) {
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
              {activeAction && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {activeAction?.header ?? (
                <SheetTitle className="text-left">
                  {activeAction ? activeAction.label : "Actions"}
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

          {activeAction ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {activeAction.content}
              </div>
              {activeAction.footer && (
                <div className="shrink-0 border-t bg-background px-4 py-3">
                  {activeAction.footer}
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setActiveActionId(action.id)}
                    className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
