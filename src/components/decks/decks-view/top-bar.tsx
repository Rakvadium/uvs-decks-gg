import { Plus } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDecksOptional } from "@/providers/DecksProvider";

export function DecksPagePrimaryAction({ className }: { className?: string } = {}) {
  const context = useDecksOptional();
  const { openAuthDialog } = useAuthDialog();
  if (!context) return null;

  const {
    actions,
    catalog: { isAuthenticated },
  } = context;

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }
    actions.openCreateDialog();
  };

  return (
    <Button size="sm" className={cn("h-9 gap-1.5", className)} onClick={handleClick}>
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">New Deck</span>
    </Button>
  );
}
