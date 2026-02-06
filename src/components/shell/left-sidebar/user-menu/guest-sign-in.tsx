import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../context";

export function LeftSidebarGuestSignInButton() {
  const { collapsed, openAuthDialog } = useLeftSidebarContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={openAuthDialog}
          className={cn(
            "w-full border-primary/30 hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
            collapsed ? "h-10 w-10 p-0" : "h-12 justify-start gap-3 px-3"
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
