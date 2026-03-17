import { Minus, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DECK_SECTION_META as SECTION_META } from "@/lib/deck/display-config";
import { useActiveDeckCardRowContext } from "./context";

export function ActiveDeckCardRowControls() {
  const {
    addCard,
    canAddToDeck,
    canMoveToSection,
    card,
    count,
    moveCard,
    moveTargets,
    removeCard,
    sectionKey,
  } = useActiveDeckCardRowContext();

  return (
    <div
      className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => removeCard(card._id, sectionKey)}
        disabled={count <= 0}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <span className="min-w-[26px] text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        x{count}
      </span>

      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => addCard(card._id, sectionKey)}
        disabled={!canAddToDeck}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7" data-no-drag>
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Move To</DropdownMenuLabel>
          {moveTargets.map((target) => (
            <DropdownMenuItem
              key={`${card._id}-move-${target}`}
              onClick={() => moveCard(card._id, sectionKey, target)}
              disabled={!canMoveToSection(target)}
            >
              Move To {SECTION_META[target].label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => removeCard(card._id, sectionKey)}
            disabled={count <= 0}
            variant="destructive"
          >
            Remove One
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
