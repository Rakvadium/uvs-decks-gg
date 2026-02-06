import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";

export function KeywordsSection() {
  const { filters, meta, setBooleanFilter, toggleStringFilter } =
    useGalleryFilterDialogContext();

  const keywords = meta.uniqueValues?.keywords ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Keywords
        </span>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={filters.keywordMatchAll ?? false}
            onCheckedChange={(checked) => setBooleanFilter("keywordMatchAll", checked)}
          />
          <Label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Match All
          </Label>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
        <div className="grid grid-cols-5 gap-1">
          {keywords.map((keyword) => {
            const selected = filters.keywords?.includes(keyword) ?? false;

            return (
              <Badge
                key={keyword}
                variant={selected ? "default" : "outline"}
                className={cn(
                  "w-full cursor-pointer justify-center truncate px-1 py-0.5 text-[10px] transition-all",
                  selected && "shadow-[0_0_8px_-3px_var(--primary)]"
                )}
                onClick={() => toggleStringFilter("keywords", keyword)}
              >
                {keyword}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
