export type ControlSize = "xs" | "sm" | "md" | "lg"

export const controlHeightClassName: Record<ControlSize, string> = {
  xs: "h-(--control-h-xs)",
  sm: "h-(--control-h-sm)",
  md: "h-(--control-h-md)",
  lg: "h-(--control-h-lg)",
}

export const controlFocusClassName =
  "outline-none focus-visible:border-[var(--chrome-focus-ring-color)] focus-visible:shadow-[var(--chrome-focus-shadow)]"

export const controlFieldClassName = [
  "rounded-control border border-[color:var(--control-dual-border)] bg-background-soft shadow-xs",
  "transition-[border-color,box-shadow,background-color,color] duration-200",
  "hover:border-[color:var(--control-dual-border-strong)]",
  controlFocusClassName,
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive-soft",
].join(" ")
