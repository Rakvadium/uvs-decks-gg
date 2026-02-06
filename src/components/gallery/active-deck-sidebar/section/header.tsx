import { Badge } from "@/components/ui/badge";
import { useActiveDeckSectionContext } from "./context";

export function ActiveDeckSectionHeader() {
  const { Icon, canDrop, currentSectionCount, isOver, sectionMeta } = useActiveDeckSectionContext();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {sectionMeta.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canDrop ? (
          <Badge variant="outline" className="border-primary/60 text-[9px] text-primary">
            {isOver ? "Release" : "Drop"}
          </Badge>
        ) : null}

        <Badge
          variant="outline"
          className="border-primary/50 bg-primary/15 px-2.5 py-0.5 font-mono text-sm font-bold text-primary"
        >
          {currentSectionCount}
        </Badge>
      </div>
    </div>
  );
}
