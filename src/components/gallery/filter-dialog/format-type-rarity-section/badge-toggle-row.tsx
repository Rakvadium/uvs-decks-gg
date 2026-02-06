import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ToggleBadgeRow({
  label,
  options,
  isSelected,
  onToggle,
  topAligned = false,
}: {
  label: string;
  options: string[];
  isSelected: (option: string) => boolean;
  onToggle: (option: string) => void;
  topAligned?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          "w-12 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground",
          topAligned && "pt-0.5"
        )}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const selected = isSelected(option);

          return (
            <Badge
              key={option}
              variant={selected ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-2 py-0.5 text-[10px] transition-all",
                selected && "shadow-[0_0_10px_-3px_var(--primary)]"
              )}
              onClick={() => onToggle(option)}
            >
              {option}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
