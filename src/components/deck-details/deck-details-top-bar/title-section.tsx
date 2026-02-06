import { Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDeckDetailsTopBarContext } from "./context";

export function DeckDetailsTopBarTitleSection() {
  const { deck, isEditing, editName, setEditName } = useDeckDetailsTopBarContext();

  if (!deck) return null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {isEditing ? (
        <Input
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          className="h-8 w-full max-w-sm font-display text-sm font-bold uppercase tracking-wide"
          placeholder="Deck name..."
        />
      ) : (
        <h1 className="truncate font-display text-sm font-bold uppercase tracking-[0.2em]" title={deck.name}>
          {deck.name}
        </h1>
      )}

      <Badge variant={deck.isPublic ? "default" : "outline"} className="hidden text-[9px] sm:inline-flex">
        {deck.isPublic ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
        {deck.isPublic ? "Public" : "Private"}
      </Badge>

      {deck.format ? (
        <Badge variant="cyber" className="hidden text-[9px] md:inline-flex">
          {deck.format}
          {deck.subFormat ? ` / ${deck.subFormat}` : ""}
        </Badge>
      ) : null}
    </div>
  );
}
