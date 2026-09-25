"use client"

import Link from "next/link"
import { useBrand } from "@/games/game-context"
import { cn } from "@/lib/utils"
import { AppBrandMark } from "./mark"
import { AppBrandWordmark } from "./wordmark"

type AppBrandLinkProps = {
  href?: string
  showWordmark?: boolean
  wordmarkLayout?: "stacked" | "inline" | "rail"
  markSize?: "sm" | "md"
  className?: string
}

const markIconBySize = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
} as const

export function AppBrandLink({
  href = "/gallery",
  showWordmark = true,
  wordmarkLayout = "stacked",
  markSize = "md",
  className,
}: AppBrandLinkProps) {
  const isRail = wordmarkLayout === "rail"
  const brand = useBrand()

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0",
        isRail
          ? "w-10 flex-col items-center gap-1.5"
          : "items-center gap-3",
        className
      )}
      aria-label={brand.title}
    >
      <AppBrandMark
        className={cn(
          "shrink-0 transition-opacity duration-150 group-hover:opacity-85",
          markIconBySize[markSize]
        )}
      />
      {showWordmark ? (
        <AppBrandWordmark
          layout={wordmarkLayout}
          size={markSize === "sm" ? "sm" : "md"}
        />
      ) : null}
    </Link>
  )
}
