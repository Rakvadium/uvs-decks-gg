import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const galleryToolbarControlClassName = cn(
  "h-9 rounded-md border border-[color:var(--control-dual-border)] bg-background/50 text-sm font-sans font-normal normal-case tracking-normal",
  "shadow-[var(--chrome-search-field-shadow)] transition-all duration-200 outline-none",
  "hover:border-[color:var(--control-dual-border-strong)] hover:bg-[color-mix(in_oklch,var(--primary)_5%,var(--secondary)_4%,var(--background)_91%)]",
  "focus-visible:border-[color:var(--control-dual-border-strong)] focus-visible:shadow-[var(--chrome-search-field-shadow-focus)]",
  "focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklch,var(--primary)_26%,var(--secondary)_26%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "[&_svg:not([class*='text-'])]:text-secondary/85"
);

interface GallerySearchFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  name?: string;
  spellCheck?: boolean;
  appearance?: "prominent" | "quiet";
  leadingSlot?: React.ReactNode;
  trailingSlot?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function GallerySearchField({
  value,
  onChange,
  onClear,
  placeholder,
  name,
  spellCheck,
  appearance = "prominent",
  leadingSlot,
  trailingSlot,
  className,
  inputClassName,
}: GallerySearchFieldProps) {
  const isQuiet = appearance === "quiet";
  const showClear = Boolean(onClear && value.length > 0);
  const hasTrailing = Boolean(trailingSlot || showClear);

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      {leadingSlot ?? (
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
            isQuiet ? "text-muted-foreground" : "text-[color:var(--control-dual-mix)]"
          )}
        />
      )}
      {hasTrailing ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center gap-0.5 pr-1.5 [&>*]:pointer-events-auto">
          {trailingSlot}
          {showClear ? (
            <button
              type="button"
              onClick={() => onClear?.()}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                isQuiet
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : "text-[color:var(--control-dual-mix)] hover:bg-[color:var(--control-dual-surface-hover)] hover:text-primary"
              )}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "h-9 bg-background/50 text-sm",
          isQuiet
            ? "border-border/60"
            : "border-[color:var(--control-dual-border)] shadow-[var(--chrome-search-field-shadow)] focus-visible:border-[color:var(--control-dual-border-strong)] focus-visible:shadow-[var(--chrome-search-field-shadow-focus),0_0_0_3px_color-mix(in_oklch,var(--secondary)_18%,transparent)]",
          !leadingSlot && "pl-9",
          inputClassName,
          hasTrailing && "pr-10"
        )}
        name={name}
        spellCheck={spellCheck}
      />
    </div>
  );
}
