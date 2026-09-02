"use client"

import { LogIn } from "lucide-react"
import { useConvexAuth } from "convex/react"
import { useAuthDialog } from "@/components/auth/auth-dialog"
import { AppBrandLink } from "@/components/brand/app-brand-link"
import { Button } from "@/components/ui/button"
import { ShellFeedbackNav } from "@/components/shell/shell-feedback-nav"
import { ShellUniversusNav } from "@/components/shell/shell-universus-nav"
import { cn } from "@/lib/utils"
import {
  SHELL_CHROME_EDGE_BOTTOM,
  SHELL_CHROME_SURFACE,
  SHELL_CHROME_WASH_STYLE,
} from "./shell-chrome"

function MobileHeaderGuestSignIn() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { openAuthDialog } = useAuthDialog()

  if (isLoading || isAuthenticated) {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => openAuthDialog("signIn")}
      className={cn(
        "h-9 shrink-0 gap-1.5 px-2.5",
        "border-accent/35 bg-sidebar-accent text-sidebar-foreground",
        "hover:border-accent/60 hover:bg-accent/10 hover:text-accent",
        "text-xs"
      )}
    >
      <LogIn className="h-4 w-4" aria-hidden />
      Sign In
    </Button>
  )
}

export function MobileHeader() {
  return (
    <header
      className={cn(
        "relative flex h-14 shrink-0 items-center justify-between gap-2 px-3",
        SHELL_CHROME_SURFACE,
        SHELL_CHROME_EDGE_BOTTOM
      )}
    >
      <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />

      <AppBrandLink
        className="relative z-10 min-w-0 gap-2.5"
        markSize="sm"
        wordmarkLayout="inline"
      />

      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        <MobileHeaderGuestSignIn />
        <ShellUniversusNav variant="mobile-header" />
        <ShellFeedbackNav variant="mobile-header" />
      </div>
    </header>
  )
}
