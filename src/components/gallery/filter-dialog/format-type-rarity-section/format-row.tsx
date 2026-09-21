import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../context";
import { StandardNextRotationToggle } from "../standard-next-rotation-toggle";

export function FormatRow() {
  const { filters, meta, toggleFormat } = useGalleryFilterDialogContext();
  const isMobile = useIsMobile();
  const activeFormat = filters.format ?? meta.formats[0]?.key ?? "standard";

  if (!isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="chrome-label-case w-12 shrink-0 text-[10px] text-muted-foreground">
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
                    "cursor-pointer px-2 py-0.5 text-[10px] transition-colors",
                    selected && "shadow-[var(--chrome-filter-tile-shadow-selected)]"
                  )}
                  onClick={() => toggleFormat(format.key)}
                >
                  {format.name}
                </Badge>
              );
            })}
          </div>
        </div>
        <StandardNextRotationToggle className="flex items-center justify-between gap-3 pl-14" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="chrome-label-case w-16 shrink-0 text-[10px] text-muted-foreground">
          Format
        </span>
        <Select value={activeFormat} onValueChange={toggleFormat}>
          <SelectTrigger size="sm" className="h-8 w-full text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta.formats.map((format) => (
              <SelectItem key={format.key} value={format.key}>
                {format.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <StandardNextRotationToggle />
    </div>
  );
}
