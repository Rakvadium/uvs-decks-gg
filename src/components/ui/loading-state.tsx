import * as React from "react"

import { Spinner, type SpinnerSize } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingStateProps extends React.ComponentProps<"div"> {
  label?: string
  size?: SpinnerSize
}

function LoadingState({ label, size = "md", className, ...props }: LoadingStateProps) {
  return (
    <div
      data-slot="loading-state"
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground", className)}
      {...props}
    >
      <Spinner size={size} />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </div>
  )
}

export { LoadingState }
export type { LoadingStateProps }
