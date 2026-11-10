"use client"

import { cn } from "@/lib/utils"
import { Kicker } from "@/components/ui/typography-headings"
import { useBrand } from "@/games/game-context"
import { AppBrandRailWordmark } from "./rail-wordmark"

type AppBrandWordmarkProps = {
  layout?: "stacked" | "inline" | "rail"
  className?: string
  size?: "sm" | "md"
}

export function AppBrandWordmark({
  layout = "stacked",
  className,
  size = "md",
}: AppBrandWordmarkProps) {
  const [lead, accent, suffix] = useBrand().wordmark

  if (layout === "rail") {
    return <AppBrandRailWordmark className={className} />
  }

  if (layout === "inline") {
    return (
      <Kicker
        className={cn(
          "truncate whitespace-nowrap font-bold text-sidebar-foreground",
          size === "sm" ? "text-sm" : "text-lg",
          className
        )}
      >
        {lead}<span className="text-accent">{accent}</span>
        <span className="text-sidebar-foreground/70">{suffix}</span>
      </Kicker>
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <Kicker
        className={cn(
          "whitespace-nowrap font-bold text-sidebar-foreground",
          size === "sm" ? "text-sm" : "text-lg"
        )}
      >
        {lead}<span className="text-accent">{accent}</span>
      </Kicker>
      <span className="chrome-label-case -mt-1 text-[10px] text-sidebar-foreground/70">
        {suffix}
      </span>
    </div>
  )
}
