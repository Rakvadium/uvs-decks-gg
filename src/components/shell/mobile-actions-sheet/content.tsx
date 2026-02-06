import { useMobileActionsSheetContext } from "./context";
import { MobileActionsSlotGrid } from "./slot-grid";

export function MobileActionsSheetContent() {
  const { ActiveComponent, ActiveFooter } = useMobileActionsSheetContext();

  if (!ActiveComponent) {
    return <MobileActionsSlotGrid />;
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ActiveComponent />
      </div>
      {ActiveFooter ? (
        <div className="shrink-0 border-t bg-background px-4 py-3">
          <ActiveFooter />
        </div>
      ) : null}
    </>
  );
}
