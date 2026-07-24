import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "h-10 w-full min-w-0 rounded-md border bg-background/50 px-4 py-2 shadow-xs transition-[border-color,box-shadow,background-color] duration-200 outline-none",
        "border-[color:var(--control-dual-border)] hover:border-[color:var(--control-dual-border-strong)]",
        "focus-visible:border-[var(--chrome-focus-ring-color)] focus-visible:shadow-[var(--chrome-focus-shadow)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "font-sans text-base md:text-sm",
        "file:inline-flex file:h-7 file:border-0 file:bg-primary/10 file:text-primary file:text-sm file:font-medium file:rounded file:px-2 file:mr-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
