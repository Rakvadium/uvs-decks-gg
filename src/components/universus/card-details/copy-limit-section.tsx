import { Copy } from "lucide-react";
import { useCardDetailsContent } from "./content-context";

export function CardDetailsCopyLimitSection() {
  const { card } = useCardDetailsContent();

  if (!card.copyLimit) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Copy className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-muted-foreground">
        Limit: <span className="font-bold text-foreground">{card.copyLimit}</span> in Main/Side
      </span>
    </div>
  );
}
