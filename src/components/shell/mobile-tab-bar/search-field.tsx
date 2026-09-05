"use client";

import { Search, X } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  name: string;
  autoFocus?: boolean;
  trailing?: ReactNode;
  className?: string;
}

export function MobileSearchField({
  value,
  onChange,
  placeholder,
  label,
  name,
  autoFocus = false,
  trailing,
  className,
}: MobileSearchFieldProps) {
  const showClear = value.length > 0;
  const endPadding = trailing ? (showClear ? "pr-[4.75rem]" : "pr-12") : showClear ? "pr-10" : "pr-4";

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        name={name}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={cn(
          "h-11 w-full min-w-0 rounded-full border-0 bg-muted/60 pl-10 text-base text-foreground outline-none placeholder:text-muted-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring",
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          endPadding
        )}
      />
      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center gap-0.5 [&>*]:pointer-events-auto">
        {showClear ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
