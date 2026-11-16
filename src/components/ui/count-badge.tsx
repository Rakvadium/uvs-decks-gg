import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const countBadgeVariants = cva(
  "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none tabular-nums",
  {
    variants: {
      tone: {
        primary: "bg-primary text-primary-foreground",
        soft: "bg-primary-selected text-primary",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "primary",
    },
  }
)

type CountBadgeTone = NonNullable<VariantProps<typeof countBadgeVariants>["tone"]>

interface CountBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  count: number
  max?: number
  tone?: CountBadgeTone
}

function CountBadge({ count, max = 99, tone, className, ...props }: CountBadgeProps) {
  return (
    <span data-slot="count-badge" className={cn(countBadgeVariants({ tone }), className)} {...props}>
      {count > max ? `${max}+` : count}
    </span>
  )
}

export { CountBadge, countBadgeVariants }
export type { CountBadgeProps, CountBadgeTone }
