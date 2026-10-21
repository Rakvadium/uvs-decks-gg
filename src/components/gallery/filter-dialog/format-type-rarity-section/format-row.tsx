import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../context";

function IncludeBannedSwitch() {
  const { filters, setIncludeBanned } = useGalleryFilterDialogContext();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Switch
        checked={filters.includeBanned === true}
        onCheckedChange={setIncludeBanned}
        aria-label="Include banned cards"
      />
      <Label className="chrome-label-case cursor-pointer text-[10px] text-muted-foreground">
        Include banned
      </Label>
    </div>
  );
}

export function FormatRow() {
  const { filters, meta, toggleFormat } = useGalleryFilterDialogContext();
  const isMobile = useIsMobile();
  const activeFormat = filters.format ?? meta.formats[0]?.key ?? "standard";

  if (!isMobile) {
    return (
      <div className="flex items-start gap-2">
        <span className="chrome-label-case w-12 shrink-0 pt-0.5 text-[10px] text-muted-foreground">
          Format
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
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
        <IncludeBannedSwitch />
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
      <IncludeBannedSwitch />
    </div>
  );
}
