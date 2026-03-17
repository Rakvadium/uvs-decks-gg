import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground",
        "h-10 w-full min-w-0 rounded-md border bg-background/50 px-4 py-2 text-base shadow-xs transition-all duration-200 outline-none",
        "border-border/50 hover:border-primary/30",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-[0_0_2px_var(--primary),0_0_8px_var(--primary)/60]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:shadow-[0_0_2px_var(--destructive),0_0_6px_var(--destructive)/60]",
        "font-mono text-sm tracking-wide",
        "file:inline-flex file:h-7 file:border-0 file:bg-primary/10 file:text-primary file:text-sm file:font-medium file:rounded file:px-2 file:mr-2",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
