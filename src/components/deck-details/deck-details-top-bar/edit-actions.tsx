import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeckDetailsTopBarContext } from "./context";

export function DeckDetailsTopBarEditActions() {
  const { cancelEditing, isSaving, saveEdits } = useDeckDetailsTopBarContext();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-8">
        <X className="mr-1 h-4 w-4" />
        Cancel
      </Button>
      <Button size="sm" onClick={() => void saveEdits()} disabled={isSaving} className="h-8">
        {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
        Save
      </Button>
    </>
  );
}
