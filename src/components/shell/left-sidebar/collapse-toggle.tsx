import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarCollapseToggle() {
  const { collapsed, onToggle } = useLeftSidebarContext();

  return (
    <div className={cn("px-2 pb-2", collapsed && "flex justify-center")}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-9 w-full text-sidebar-foreground/60 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
            Expand
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-start gap-3 px-3 font-mono text-xs uppercase tracking-wider text-sidebar-foreground/60 hover:bg-primary/10 hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Collapse</span>
        </Button>
      )}
    </div>
  );
}
