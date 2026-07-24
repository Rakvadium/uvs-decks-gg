import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SHELL_RAIL_ITEM_SIZE_CLASS } from "../../shell-chrome";
import { useLeftSidebarContext } from "../context";

export function LeftSidebarGuestSignInButton() {
  const { collapsed, openAuthDialog } = useLeftSidebarContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={() => openAuthDialog()}
          className={cn(
            "border-accent/35 text-sidebar-foreground hover:border-accent/60 hover:bg-accent/10 hover:text-accent [&_svg]:text-sidebar-foreground hover:[&_svg]:text-accent",
            collapsed ? cn(SHELL_RAIL_ITEM_SIZE_CLASS, "p-0") : "h-12 w-full justify-start gap-3 px-3"
          )}
        >
          <LogIn className="h-4 w-4 shrink-0" />
          {!collapsed ? <span className="font-mono text-xs uppercase tracking-wider">Sign In</span> : null}
        </Button>
      </TooltipTrigger>
      {collapsed ? (
        <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
          Sign In
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}
