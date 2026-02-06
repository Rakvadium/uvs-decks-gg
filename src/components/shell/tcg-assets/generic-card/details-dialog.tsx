import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <DialogContent className="md:min-w-[65vw] md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{cardData.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 overflow-auto md:grid-cols-2">
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
      </DialogContent>
    </Dialog>
  );
}
