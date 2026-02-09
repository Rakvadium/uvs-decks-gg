import { Layers, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeckCreateDialogModel } from "./hook";

export function DeckCreateDialog() {
  const model = useDeckCreateDialogModel();

  return (
    <Dialog open={model.isOpen} onOpenChange={model.handleOpenChange}>
      <DialogContent size="md" className="overflow-hidden p-0" showCloseButton={false}>
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 right-10 h-24 w-24 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto p-6 pb-24 md:pb-20">
            <DialogHeader className="border-border/20 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
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
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Deck name
              </label>
              <div className="relative mt-2">
                <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  placeholder="Deck name..."
                  value={model.newDeckName}
                  onChange={(event) => model.setNewDeckName(event.target.value)}
                  className="h-12 border-border/60 bg-background/40 pl-10 text-base focus-visible:ring-primary/25"
                  onKeyDown={model.handleNameKeyDown}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Tip: Use a format or archetype keyword to make it easier to find later.
              </p>
            </DialogBody>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="h-11 px-6" onClick={model.closeDialog}>
                Close
              </Button>
            </DialogClose>
            <Button className="h-11 px-6" onClick={() => void model.handleCreate()} disabled={!model.canCreate}>
              {model.isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Deck
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
