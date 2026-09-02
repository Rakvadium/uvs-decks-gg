import { cn } from "@/lib/utils"
import { Kicker } from "@/components/ui/typography-headings"
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
        UVS<span className="text-accent">DECKS</span>
        <span className="text-sidebar-foreground/70">.GG</span>
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
        UVS<span className="text-accent">DECKS</span>
      </Kicker>
      <span className="chrome-label-case -mt-1 text-[10px] text-sidebar-foreground/70">
        .GG
      </span>
    </div>
  )
}
