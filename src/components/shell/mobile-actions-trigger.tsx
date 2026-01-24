"use client"

import { useMobileShell } from "./mobile-shell-context"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"

interface MobileActionsTriggerProps {
  hasActions: boolean
}

export function MobileActionsTrigger({ hasActions }: MobileActionsTriggerProps) {
  const { setActionsSheetOpen } = useMobileShell()

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
