import { Layers, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
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

  const canCreate = Boolean(newDeckName.trim()) && !isCreating;

  return (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent
        size="md"
        contentPadding="none"
        className="overflow-hidden p-0"
        showCloseButton={false}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline" className="h-11 px-6">
                Close
              </Button>
            </DialogClose>
            <Button
              className="h-11 px-6"
              onClick={() => void handleCreate()}
              disabled={!canCreate}
            >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Deck
            </Button>
          </>
        }
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 right-10 h-24 w-24 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-6">
            <DialogHeader className="border-border/30 pb-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Create New Deck</DialogTitle>
                  <DialogDescription className="text-sm">
                    Give it a name now; you can always refine it later.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="pt-4">
              <label
                htmlFor="gallery-create-deck-name"
                className="chrome-label-case text-xs text-muted-foreground"
              >
                Deck name
              </label>
              <div className="relative mt-2">
                <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="gallery-create-deck-name"
                  name="deck-name"
                  autoComplete="off"
                  placeholder="My Standard Aggro…"
                  value={newDeckName}
                  onChange={(event) => setNewDeckName(event.target.value)}
                  className="h-12 bg-background/50 pl-10 text-base"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleCreate();
                    }
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Tip: Use a format or archetype keyword to make it easier to find later.
              </p>
            </DialogBody>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
