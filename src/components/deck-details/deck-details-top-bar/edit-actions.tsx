import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeckDetailsTopBarContext } from "./context";

interface DeckDetailsTopBarEditActionsProps {
  compact?: boolean;
}

export function DeckDetailsTopBarEditActions({ compact = false }: DeckDetailsTopBarEditActionsProps) {
  const { cancelEditing, isSaving, saveEdits } = useDeckDetailsTopBarContext();

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={cancelEditing}
        className={cn("h-8", compact && "w-8")}
        aria-label="Cancel deck edits"
      >
        <X className={cn("h-4 w-4", !compact && "mr-1")} />
        {!compact ? "Cancel" : null}
      </Button>
      <Button
        size={compact ? "icon" : "sm"}
        onClick={() => void saveEdits()}
        disabled={isSaving}
        className={cn("h-8", compact && "w-8")}
        aria-label="Save deck edits"
      >
        {isSaving ? <Loader2 className={cn("h-4 w-4 animate-spin", !compact && "mr-1")} /> : <Save className={cn("h-4 w-4", !compact && "mr-1")} />}
        {!compact ? "Save" : null}
      </Button>
    </>
  );
}
