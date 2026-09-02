import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  SHELL_CHROME_JUNCTION_EDGE_LEFT,
  SHELL_SIDEBAR_SURFACE_STYLE,
  SHELL_RAIL_ITEM_ACTIVE,
  SHELL_RAIL_ITEM_IDLE,
  SHELL_RAIL_ITEM_SIZE_CLASS,
  SHELL_RAIL_STACK_CLASS,
  SHELL_RAIL_TOP_PADDING_CLASS,
  SHELL_RAIL_WIDTH,
} from "../shell-chrome";
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
    <div
      className="relative flex h-full shrink-0 flex-col items-center text-sidebar-foreground"
      style={{ width: SHELL_RAIL_WIDTH, ...SHELL_SIDEBAR_SURFACE_STYLE }}
    >
      <div className={SHELL_CHROME_JUNCTION_EDGE_LEFT} />
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
              "relative h-16 w-1 rounded-full transition-[border-color,box-shadow,background-color,opacity,transform] duration-150",
              isResizing
                ? "bg-accent shadow-[var(--chrome-shell-rail-resize-shadow)]"
                : "bg-sidebar-border group-hover:bg-accent/80 group-hover:shadow-[var(--chrome-shell-rail-resize-shadow-hover)]"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 mx-auto w-px rounded-full",
                isResizing ? "bg-accent-foreground/30" : "bg-transparent group-hover:bg-accent-foreground/20"
              )}
            />
          </div>
          <div className={cn("absolute inset-y-0 -inset-x-1", isResizing && "bg-accent/5")} />
        </div>
      ) : null}

      <div className={cn("relative z-10", SHELL_RAIL_STACK_CLASS, SHELL_RAIL_TOP_PADDING_CLASS)}>
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;
          const isActive = activeActionId === slot.id;
          const isMediaIcon = slot.iconFit === "media";

          return (
            <Tooltip key={slot.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative rounded-sm border transition-[color,background-color,border-color,box-shadow] duration-200",
                    SHELL_RAIL_ITEM_SIZE_CLASS,
                    isMediaIcon && "overflow-hidden p-0",
                    isActive ? SHELL_RAIL_ITEM_ACTIVE : SHELL_RAIL_ITEM_IDLE
                  )}
                  onClick={() => setActiveSidebarAction(isActive ? null : slot.id)}
                  aria-label={label}
                  aria-pressed={isActive}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        isMediaIcon ? "size-full" : "size-5",
                        isActive && "[filter:var(--chrome-shell-icon-drop-shadow)]"
                      )}
                    />
                  ) : (
                    <span className="text-xs font-semibold">{label.slice(0, 1)}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="chrome-label-case text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
