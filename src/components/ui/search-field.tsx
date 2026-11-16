"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import type { ControlSize } from "@/components/ui/control"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const SEARCH_FIELD_SIZE: Record<ControlSize, { icon: string; input: string }> = {
  xs: { icon: "left-2 size-3.5", input: "pl-7 pr-7" },
  sm: { icon: "left-2.5 size-3.5", input: "pl-8 pr-8" },
  md: { icon: "left-3 size-4", input: "pl-9 pr-9" },
  lg: { icon: "left-4 size-4", input: "pl-10 pr-10" },
}

export type SearchFieldProps = Omit<InputProps, "value" | "onChange" | "type" | "size"> & {
  value: string
  onValueChange: (value: string) => void
  size?: ControlSize
}

function SearchField({
  value,
  onValueChange,
  size = "md",
  className,
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: SearchFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const layout = SEARCH_FIELD_SIZE[size]

  return (
    <div data-slot="search-field" className={cn("relative min-w-0", className)}>
      <Search
        aria-hidden
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground", layout.icon)}
      />
      <Input
        ref={inputRef}
        type="search"
        size={size}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn(layout.input, "[&::-webkit-search-cancel-button]:hidden")}
        {...props}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onValueChange("")
            inputRef.current?.focus()
          }}
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-(--hover-bg) hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export { SearchField }
