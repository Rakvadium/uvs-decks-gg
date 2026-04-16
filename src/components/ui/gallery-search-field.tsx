import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GallerySearchFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  spellCheck?: boolean;
  appearance?: "prominent" | "quiet";
  leadingSlot?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function GallerySearchField({
  value,
  onChange,
  placeholder,
  name,
  spellCheck,
  appearance = "prominent",
  leadingSlot,
  className,
  inputClassName,
}: GallerySearchFieldProps) {
  const isQuiet = appearance === "quiet";

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
          inputClassName
        )}
        name={name}
        spellCheck={spellCheck}
      />
    </div>
  );
}
