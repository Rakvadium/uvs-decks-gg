export const SHELL_CHROME_SURFACE =
  "relative bg-sidebar text-sidebar-foreground";

export const SHELL_CHROME_TOP_SURFACE =
  "relative bg-transparent text-sidebar-foreground";

export const SHELL_CHROME_WASH_STYLE = {
  background: "var(--chrome-shell-sidebar-wash)",
} as const;

export const SHELL_CHROME_EDGE_BOTTOM = "border-b border-sidebar-border";

export const SHELL_CHROME_EDGE_LEFT = "border-l border-sidebar-border";

export const SHELL_CHROME_EDGE_RIGHT = "border-r border-sidebar-border";

export const SHELL_CHROME_JUNCTION_EDGE_RIGHT =
  "pointer-events-none absolute inset-y-0 right-0 w-px bg-sidebar-border";

export const SHELL_CHROME_JUNCTION_EDGE_LEFT =
  "pointer-events-none absolute inset-y-0 left-0 w-px bg-sidebar-border";

export const SHELL_SIDEBAR_SURFACE_STYLE = {
  background: "var(--sidebar)",
} as const;

export const SHELL_NAV_ITEM_BASE =
  "relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200";

export const SHELL_NAV_ITEM_IDLE =
  "border-transparent text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

export const SHELL_NAV_ITEM_ACTIVE =
  "border-accent/55 bg-accent/18 text-accent shadow-[var(--chrome-shell-nav-active-shadow)]";

export const SHELL_NAV_ICON_ACTIVE =
  "text-accent [filter:var(--chrome-shell-icon-drop-shadow)]";

export const SHELL_RAIL_WIDTH = 64;

export const SHELL_RAIL_ITEM_SIZE_CLASS = "size-9";

export const SHELL_RAIL_ITEM_COLLAPSED_CLASS =
  "size-9 shrink-0 justify-center gap-0 p-0";

export const SHELL_RAIL_STACK_CLASS = "flex flex-col items-center gap-2 p-1";

export const SHELL_RAIL_TOP_PADDING_CLASS = "pt-4";

export const SHELL_RAIL_ITEM_IDLE =
  "border-transparent text-sidebar-foreground hover:border-accent/40 hover:bg-accent/12 hover:text-accent";

export const SHELL_RAIL_ITEM_ACTIVE =
  "border-accent/55 bg-accent/18 text-accent shadow-[var(--chrome-shell-rail-active-shadow)]";
