import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const galleryToolbarControlClassName = cn(
  "h-9 rounded-md border border-primary/40 bg-background/50 text-sm font-sans font-normal normal-case tracking-normal",
  "shadow-[var(--chrome-search-field-shadow)] transition-all duration-200 outline-none",
  "hover:border-primary/50",
  "focus-visible:border-primary focus-visible:shadow-[var(--chrome-search-field-shadow-focus)]",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            isQuiet ? "text-muted-foreground" : "text-primary/70"
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
                  : "text-primary/70 hover:bg-primary/10 hover:text-primary"
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
            : "border-primary/40 shadow-[var(--chrome-search-field-shadow)] focus-visible:border-primary focus-visible:shadow-[var(--chrome-search-field-shadow-focus)]",
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
