import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDecksSidebarContext } from "./context";

export function DeckCreateDialog() {
  const {
    handleCreate,
    isCreateOpen,
    isCreating,
    newDeckName,
    setIsCreateOpen,
    setNewDeckName,
  } = useDecksSidebarContext();

  return (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent size="sm" className="overflow-hidden">
        <div className="relative p-6">
          <DialogHeader>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogDescription>Name it now, refine it later.</DialogDescription>
          </DialogHeader>

          <DialogBody className="pt-4">
            <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Deck name
            </label>
            <div className="relative mt-2">
              <Input
                placeholder="Deck name..."
                value={newDeckName}
                onChange={(event) => setNewDeckName(event.target.value)}
                className="h-11 text-sm"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleCreate();
                  }
                }}
              />
            </div>
          </DialogBody>

          <DialogFooter className="mt-4 gap-2 border-t-0 bg-transparent p-0">
            <Button
              variant="outline"
              className="h-10 px-4"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-4"
              onClick={() => void handleCreate()}
              disabled={isCreating || !newDeckName.trim()}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Deck
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
