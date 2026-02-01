"use client"

import { useMobileShell } from "./mobile-shell-context"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"
import { useShellSlot } from "./shell-slot-provider"
import { usePathname } from "next/navigation"

function getPageType(pathname: string) {
  if (pathname.includes("/gallery")) return "gallery"
  return null
}

export function MobileActionsTrigger() {
  const { setActionsSheetOpen } = useMobileShell()
  const { state } = useShellSlot()
  const pathname = usePathname()
  const pageType = getPageType(pathname)
  const hasActions = (state.slots.get("right-sidebar")?.length ?? 0) > 0

  if (!hasActions) {
    return null
  }

  if (pageType === "gallery") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-[7.5rem] right-0 z-40 h-10 w-10 rounded-l-lg rounded-r-none rounded-bl-none shadow-md border-l border-t border-primary border-b-0 border-r-0 bg-background/95 backdrop-blur-lg"
        onClick={() => setActionsSheetOpen(true)}
      >
        <PanelRightOpen className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed bottom-32 right-3 z-40 h-10 w-10 rounded-full shadow-md border border-border/50 bg-background/95 backdrop-blur-lg"
      onClick={() => setActionsSheetOpen(true)}
    >
      <PanelRightOpen className="h-5 w-5" />
    </Button>
  )
}
