"use client"

import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

function FitWidthLine({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    let cancelled = false

    const fit = () => {
      if (cancelled) return
      const available = container.clientWidth
      if (available <= 0) return

      let low = 4
      let high = available
      let best = low

      while (high - low > 0.2) {
        const mid = (low + high) / 2
        text.style.fontSize = `${mid}px`
        if (text.scrollWidth <= available) {
          best = mid
          low = mid
        } else {
          high = mid
        }
      }

      text.style.fontSize = `${best}px`
    }

    fit()
    void document.fonts?.ready.then(fit)

    if (typeof ResizeObserver === "undefined") {
      return () => {
        cancelled = true
      }
    }

    const observer = new ResizeObserver(fit)
    observer.observe(container)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [children])

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <span
        ref={textRef}
        className={cn(
          "block whitespace-nowrap text-center leading-none",
          className
        )}
      >
        {children}
      </span>
    </div>
  )
}

type AppBrandRailWordmarkProps = {
  className?: string
}

export function AppBrandRailWordmark({ className }: AppBrandRailWordmarkProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-stretch gap-0.75 mt-2",
        className
      )}
    >
      <FitWidthLine className="font-display font-bold uppercase text-sidebar-foreground">
        UVS
      </FitWidthLine>
      <FitWidthLine className="font-display font-bold uppercase text-accent">
        DECKS
      </FitWidthLine>
      <span className="mt-0.5 self-center font-mono text-[16px] font-bold uppercase leading-none tracking-[0.1em] text-sidebar-foreground/70">
        GG
      </span>
    </div>
  )
}
