import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeckDetailsHeroPanelContext } from "./context";

export function DeckDetailsHeroReadyBadge() {
  const { mainCount } = useDeckDetailsHeroPanelContext();

  if (mainCount < 60) return null;

  return (
    <div className="absolute right-2 top-2 z-20">
      <Badge tone="success" className="text-[10px]">
        <Check className="mr-1 h-3 w-3" />
        Ready
      </Badge>
    </div>
  );
}
