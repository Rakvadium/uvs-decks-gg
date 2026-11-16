import * as React from "react"

import { controlFieldClassName, controlHeightClassName, type ControlSize } from "@/components/ui/control"
import { cn } from "@/lib/utils"

const INPUT_SIZE: Record<ControlSize, string> = {
  xs: "px-2.5 text-base md:text-xs",
  sm: "px-3 text-base md:text-sm",
  md: "px-4 text-base md:text-sm",
  lg: "px-4 text-base",
}

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & { size?: ControlSize }

function Input({ className, type, size = "md", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "w-full min-w-0 py-1 font-sans disabled:pointer-events-none",
        controlFieldClassName,
        controlHeightClassName[size],
        INPUT_SIZE[size],
        "file:inline-flex file:h-7 file:border-0 file:bg-primary-wash file:text-primary file:text-sm file:font-medium file:rounded-md file:px-2 file:mr-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
