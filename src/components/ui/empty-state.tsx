import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center rounded-surface border border-dashed border-placeholder bg-muted-tint",
  {
    variants: {
      variant: {
        page: "gap-3 px-6 py-16",
        panel: "gap-2 px-4 py-10",
        inline: "gap-1 px-3 py-4",
      },
    },
    defaultVariants: {
      variant: "panel",
    },
  }
)

type EmptyStateVariant = NonNullable<VariantProps<typeof emptyStateVariants>["variant"]>

const ICON_CLASS: Record<Exclude<EmptyStateVariant, "inline">, string> = {
  page: "size-12 [&>svg]:size-6",
  panel: "size-10 [&>svg]:size-5",
}

const TITLE_CLASS: Record<EmptyStateVariant, string> = {
  page: "text-base font-semibold",
  panel: "text-sm font-medium",
  inline: "text-xs font-medium",
}

const DESCRIPTION_CLASS: Record<EmptyStateVariant, string> = {
  page: "max-w-md text-sm",
  panel: "max-w-sm text-sm",
  inline: "text-xs",
}

interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  variant?: EmptyStateVariant
  icon?: LucideIcon
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

function EmptyState({
  variant = "panel",
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div data-slot="empty-state" data-variant={variant} className={cn(emptyStateVariants({ variant }), className)} {...props}>
      {Icon && variant !== "inline" ? (
        <div
          data-slot="empty-state-icon"
          className={cn(
            "mb-1 flex items-center justify-center rounded-surface border border-surface bg-background-soft text-muted-foreground",
            ICON_CLASS[variant]
          )}
        >
          <Icon aria-hidden />
        </div>
      ) : null}
      {title ? (
        <p data-slot="empty-state-title" className={cn("text-foreground", TITLE_CLASS[variant])}>
          {title}
        </p>
      ) : null}
      {description ? (
        <div data-slot="empty-state-description" className={cn("text-muted-foreground", DESCRIPTION_CLASS[variant])}>
          {description}
        </div>
      ) : null}
      {action ? (
        <div data-slot="empty-state-action" className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      ) : null}
      {children}
    </div>
  )
}

export { EmptyState, emptyStateVariants }
export type { EmptyStateProps, EmptyStateVariant }
