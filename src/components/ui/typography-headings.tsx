import * as React from "react"

import { cn } from "@/lib/utils"

const chromeHeadingStyle: React.CSSProperties = {
  textTransform: "var(--chrome-heading-transform, none)" as React.CSSProperties["textTransform"],
  letterSpacing: "var(--chrome-heading-letter-spacing, normal)",
}

function PageHeading({
  className,
  style,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-heading"
      className={cn(
        "text-3xl font-bold tracking-tight font-display sm:text-4xl",
        className,
      )}
      style={{ ...chromeHeadingStyle, ...style }}
      {...props}
    />
  )
}

function SectionHeading({
  className,
  style,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-heading"
      className={cn(
        "text-xl font-semibold tracking-tight sm:text-2xl",
        className,
      )}
      style={{ ...chromeHeadingStyle, ...style }}
      {...props}
    />
  )
}

function Kicker({
  className,
  style,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="kicker"
      className={cn(
        "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
      style={{ ...chromeHeadingStyle, ...style }}
      {...props}
    />
  )
}

export { PageHeading, SectionHeading, Kicker }
