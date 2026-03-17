import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRightSidebarContext } from "./context";

export function RightSidebarIconRail() {
  const {
    sidebarSlots,
    activeActionId,
    isExpanded,
    isResizing,
    handleResizeStart,
    setActiveSidebarAction,
  } = useRightSidebarContext();

  return (
    <div className="relative flex h-full w-12 shrink-0 flex-col items-center gap-1 border-l border-sidebar-border/50 bg-sidebar pb-3 pt-3">
      {isExpanded ? (
        <div
          className={cn(
            "group absolute bottom-0 left-0 top-0 z-0 flex w-3 -translate-x-2/3 cursor-ew-resize select-none items-center justify-center",
            isResizing && "cursor-ew-resize"
          )}
          onMouseDown={handleResizeStart}
          style={{ touchAction: "none" }}
        >
          <div
            className={cn(
              "relative h-16 w-1 rounded-full transition-all duration-150",
              isResizing
                ? "bg-primary shadow-[0_0_3px_var(--primary),0_0_8px_var(--primary)/60]"
                : "bg-border/40 group-hover:bg-primary/70 group-hover:shadow-[0_0_2px_var(--primary),0_0_6px_var(--primary)/50]"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 mx-auto w-px rounded-full",
                isResizing ? "bg-primary-foreground/30" : "bg-transparent group-hover:bg-primary-foreground/20"
              )}
            />
          </div>
          <div className={cn("absolute inset-y-0 -inset-x-1", isResizing && "bg-primary/5")} />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />

      <div className="relative z-10 flex flex-col items-center gap-1.5">
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;
          const isActive = activeActionId === slot.id;

          return (
            <Tooltip key={slot.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 border border-transparent transition-all duration-200",
                    isActive
                      ? "border-primary/30 bg-primary/15 text-primary shadow-[0_0_2px_var(--primary)/60,0_0_6px_var(--primary)/40]"
                      : "hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                  )}
                  onClick={() => setActiveSidebarAction(isActive ? null : slot.id)}
                >
                  {Icon ? (
                    <span className="flex h-full w-full items-center justify-center">
                      <Icon
                        className={cn("h-full w-full rounded-md", isActive && "drop-shadow-[0_0_3px_var(--primary)]")}
                      />
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold">{label.slice(0, 1)}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-mono text-xs uppercase tracking-wider">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
