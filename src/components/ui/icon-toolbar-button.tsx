import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

export type IconToolbarButtonProps = Omit<ButtonProps, "variant" | "size" | "aria-label"> & {
  label: string
  active?: boolean
}

const IconToolbarButton = React.forwardRef<HTMLButtonElement, IconToolbarButtonProps>(
  ({ label, active = false, className, type = "button", ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      data-active={active ? "" : undefined}
      className={cn(
        "text-muted-foreground hover:border-transparent hover:bg-(--hover-bg) hover:text-foreground",
        "data-[active]:bg-(--selected-bg) data-[active]:text-(--selected-fg)",
        className
      )}
      {...props}
    />
  )
)
IconToolbarButton.displayName = "IconToolbarButton"

export { IconToolbarButton }
