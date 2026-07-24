import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SHELL_RAIL_ITEM_SIZE_CLASS } from "../shell-chrome";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarCollapseToggle() {
  const { collapsed, onToggle } = useLeftSidebarContext();
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            SHELL_RAIL_ITEM_SIZE_CLASS,
            "shrink-0 text-sidebar-foreground hover:bg-accent/10 hover:text-accent"
          )}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
        {collapsed ? "Expand" : "Collapse"}
      </TooltipContent>
    </Tooltip>
  );
}
