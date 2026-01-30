"use client"

import { useMobileShell } from "./mobile-shell-context"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"
import { useShellSlot } from "./shell-slot-provider"

export function MobileActionsTrigger() {
  const { setActionsSheetOpen } = useMobileShell()
  const { state } = useShellSlot()
  const hasActions = (state.slots.get("right-sidebar")?.length ?? 0) > 0

  if (!hasActions) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute bottom-32 right-3 z-20 h-10 w-10 rounded-full shadow-md border border-border/50"
      onClick={() => setActionsSheetOpen(true)}
    >
      <PanelRightOpen className="h-5 w-5" />
    </Button>
  )
}
