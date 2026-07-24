import type { ComponentProps } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHELL_RAIL_ITEM_SIZE_CLASS } from "../../shell-chrome";
import { useLeftSidebarContext } from "../context";
import { LeftSidebarUserIdentity } from "./user-identity";

type LeftSidebarUserMenuTriggerProps = Omit<ComponentProps<typeof Button>, "variant">;

export function LeftSidebarUserMenuTrigger({ className, ...props }: LeftSidebarUserMenuTriggerProps) {
  const { collapsed } = useLeftSidebarContext();

  return (
    <Button
      variant="ghost"
      className={cn(
        "normal-case tracking-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
        collapsed
          ? cn(SHELL_RAIL_ITEM_SIZE_CLASS, "p-0")
          : "h-12 w-full justify-start gap-2 px-2",
        className
      )}
      {...props}
    >
      <LeftSidebarUserIdentity
        className={cn("min-w-0 flex-1", collapsed && "justify-center")}
        avatarClassName={collapsed ? "size-7" : undefined}
        showDetails={!collapsed}
      />
      {!collapsed ? <ChevronsUpDown className="ml-auto size-4 shrink-0" /> : null}
    </Button>
  );
}
