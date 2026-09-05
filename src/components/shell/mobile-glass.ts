export const MOBILE_GLASS_GRADIENT_RING =
  "bg-[linear-gradient(115deg,color-mix(in_oklch,var(--primary)_40%,transparent),color-mix(in_oklch,var(--border)_65%,transparent)_28%,color-mix(in_oklch,var(--border)_65%,transparent)_72%,color-mix(in_oklch,var(--secondary)_40%,transparent))]";

export const MOBILE_GLASS_SURFACE = "bg-background/80 backdrop-blur-xl";

export const MOBILE_GLASS_BAR =
  "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80";

export const MOBILE_GLASS_HAIRLINE_BOTTOM = "border-b border-border/30";

export const MOBILE_GLASS_HAIRLINE_TOP = "border-t border-border/30";

export const MOBILE_NAV_ICON_BUTTON =
  "relative flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors duration-150 motion-safe:active:scale-95 motion-safe:transition-[color,background-color,transform] hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const MOBILE_NAV_ICON_BUTTON_ACTIVE = "bg-primary/20 text-primary";

export const MOBILE_INSET_GROUP =
  "overflow-hidden rounded-xl border border-border/30 bg-card/80";

export const MOBILE_INSET_ROW =
  "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:bg-muted/60 active:bg-muted/80";

export const MOBILE_INSET_DIVIDER =
  "[&>*+*]:border-t [&>*+*]:border-border/30";

export const MOBILE_SHEET_PANEL =
  "rounded-t-xl border-x border-t [border-color:var(--chrome-sheet-border)] bg-background/95 backdrop-blur-xl shadow-[var(--chrome-sheet-shadow)]";

export const MOBILE_SHEET_GRABBER =
  "mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/40";

export const MOBILE_SAFE_BOTTOM = "pb-[max(0.75rem,env(safe-area-inset-bottom))]";
