import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DefaultDetails } from "./default-details";
import { useGenericCardContext } from "./context";
import { CardArt } from "./card-art";

interface GenericCardDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenericCardDetailsDialog({
  open,
  onOpenChange,
}: GenericCardDetailsDialogProps) {
  const {
    cardData,
    deckCount,
    onAddToDeck,
    onRemoveFromDeck,
    renderDetails,
  } = useGenericCardContext();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 md:min-w-[65vw] md:max-h-[90vh]"
        showCloseButton={false}
        footer={
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        }
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
            <DialogTitle>{cardData.name}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex justify-center">
                <CardArt className="group w-64" clickable={false} />
              </div>

              <div className="space-y-4">
                {renderDetails ? (
                  renderDetails({
                    cardData,
                    deckCount,
                    onAddToDeck,
                    onRemoveFromDeck,
                  })
                ) : (
                  <DefaultDetails
                    cardData={cardData}
                    deckCount={deckCount}
                    onAddToDeck={onAddToDeck}
                    onRemoveFromDeck={onRemoveFromDeck}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
