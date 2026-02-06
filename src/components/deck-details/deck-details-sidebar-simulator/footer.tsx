import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dispatchSimulatorRedraw } from "./redraw";
import { useSimulatorDeckState } from "./use-simulator-deck-state";

export function HandSimulatorSidebarFooter() {
  const { canDraw } = useSimulatorDeckState();

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={dispatchSimulatorRedraw}
      disabled={!canDraw}
    >
      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
      Redraw
    </Button>
  );
}
