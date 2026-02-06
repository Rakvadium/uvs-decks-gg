import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../context";

export function FormatRow() {
  const { filters, meta, toggleFormat } = useGalleryFilterDialogContext();

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Format
      </span>
      <div className="flex flex-wrap gap-1">
        {meta.formats.map((format) => {
          const selected = filters.format === format.key;

          return (
            <Badge
              key={format.key}
              variant={selected ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-2 py-0.5 text-[10px] transition-all",
                selected && "shadow-[0_0_10px_-3px_var(--primary)]"
              )}
              onClick={() => toggleFormat(format.key)}
            >
              {format.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
