import type { HTMLAttributes } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobileActionsSheetContext } from "./context";

interface MobileActionsSheetHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function MobileActionsSheetHeader({ className, ...props }: MobileActionsSheetHeaderProps) {
  const { activeSlot, ActiveHeader, handleBack } = useMobileActionsSheetContext();

  return (
    <div className={cn("flex shrink-0 flex-row items-center justify-between border-b px-4 py-3", className)} {...props}>
      <div className="min-w-0 flex flex-1 items-center gap-2">
        {activeSlot ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}

        {ActiveHeader ? (
          <ActiveHeader />
        ) : (
          <h2 className="text-left text-lg font-semibold text-foreground">
            {activeSlot ? (activeSlot.label ?? activeSlot.id) : "Actions"}
          </h2>
        )}
      </div>
    </div>
  );
}
