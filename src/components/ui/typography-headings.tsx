import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pageHeadingVariants = cva("chrome-heading-case", {
  variants: {
    size: {
      sm: "text-xl font-semibold",
      md: "text-2xl font-bold",
      lg: "text-3xl font-bold sm:text-4xl",
      hero: "text-4xl font-bold md:text-5xl",
    },
  },
  defaultVariants: { size: "md" },
})

const sectionHeadingVariants = cva("chrome-heading-case", {
  variants: {
    size: {
      xs: "text-sm font-semibold",
      sm: "text-base font-semibold",
      md: "text-lg font-semibold",
      lg: "text-xl font-bold",
      xl: "text-2xl font-bold sm:text-3xl",
    },
  },
  defaultVariants: { size: "md" },
})

const kickerVariants = cva("chrome-label-case font-semibold", {
  variants: {
    size: {
      meta: "text-[10px]",
      sm: "text-xs",
      md: "text-sm",
    },
    tone: {
      muted: "text-muted-foreground",
      primary: "text-primary",
      foreground: "text-foreground",
    },
  },
  defaultVariants: { size: "sm", tone: "muted" },
})

function PageHeading({
  className,
  size,
  ...props
}: React.ComponentProps<"h1"> & VariantProps<typeof pageHeadingVariants>) {
  return (
    <h1
      data-slot="page-heading"
      className={cn(pageHeadingVariants({ size }), className)}
      {...props}
    />
  )
}

function SectionHeading({
  className,
  size,
  as: Tag = "h2",
  ...props
}: React.ComponentProps<"h2"> &
  VariantProps<typeof sectionHeadingVariants> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Tag
      data-slot="section-heading"
      className={cn(sectionHeadingVariants({ size }), className)}
      {...props}
    />
  )
}

function Kicker({
  className,
  size,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof kickerVariants>) {
  return (
    <span
      data-slot="kicker"
      className={cn(kickerVariants({ size, tone }), className)}
      {...props}
    />
  )
}

export { PageHeading, SectionHeading, Kicker, pageHeadingVariants, sectionHeadingVariants, kickerVariants }
