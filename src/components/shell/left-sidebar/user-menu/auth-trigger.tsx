import type { ComponentProps } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../context";

type LeftSidebarUserMenuTriggerProps = Omit<ComponentProps<typeof Button>, "variant">;

export function LeftSidebarUserMenuTrigger({ className, ...props }: LeftSidebarUserMenuTriggerProps) {
  const { collapsed, user } = useLeftSidebarContext();

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full border border-transparent text-sidebar-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary data-[state=open]:border-primary/30 data-[state=open]:bg-primary/15 data-[state=open]:text-primary",
        collapsed ? "h-10 w-10 p-0" : "h-14 justify-start gap-3 px-3",
        className
      )}
      {...props}
    >
      <Avatar className="h-8 w-8 shrink-0 border border-primary/30 shadow-[var(--chrome-shell-avatar-ring)]">
        {user?.image ? <AvatarImage src={user.image} alt={user.username || "User"} /> : null}
        <AvatarFallback className="bg-primary/20 font-mono text-sm font-bold text-primary">
          {user?.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {!collapsed ? (
        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate font-mono text-xs font-medium uppercase tracking-wide">
            {user?.username || "User"}
          </span>
          <span className="truncate font-mono text-xs text-sidebar-foreground/50">
            {user?.email || "Not signed in"}
          </span>
        </div>
      ) : null}
    </Button>
  );
}
