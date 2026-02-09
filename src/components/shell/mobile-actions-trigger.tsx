"use client"

import { useMobileShell } from "./mobile-shell-context"
import { Button } from "@/components/ui/button"
import { PanelBottomOpen } from "lucide-react"
import { useShellSlot } from "./shell-slot-provider"

export function MobileActionsTrigger() {
  const { setActionsSheetOpen } = useMobileShell()
  const { state } = useShellSlot()
  const hasActions = (state.slots.get("right-sidebar")?.length ?? 0) > 0

  if (!hasActions) {
    return null
  }

  return (
    <div className="pointer-events-none absolute bottom-full right-3 z-40 mb-2">
      <Button
        variant="ghost"
        size="icon"
        className="pointer-events-auto h-9 w-10 rounded-lg border border-primary/35 bg-background/70 text-primary shadow-[0_0_14px_-8px_var(--primary)] hover:bg-background/85"
        onClick={() => setActionsSheetOpen(true)}
        aria-label="Open actions panel"
      >
        <PanelBottomOpen className="h-5 w-5" />
      </Button>
    </div>
  )
}
