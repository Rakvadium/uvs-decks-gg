import type { ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "@/lib/utils";

type OptionTileVariant = "outline" | "ghost";

const IDLE: Record<OptionTileVariant, string> = {
  outline: "border-surface bg-background enabled:hover:bg-(--hover-bg)",
  ghost: "border-transparent enabled:hover:bg-(--hover-bg)",
};

export type OptionTileProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  selected: boolean;
  variant?: OptionTileVariant;
  ref?: Ref<HTMLButtonElement>;
};

export function OptionTile({ selected, variant = "outline", className, ...props }: OptionTileProps) {
  return (
    <button
      type="button"
      data-slot="option-tile"
      aria-pressed={selected}
      data-state={selected ? "on" : "off"}
      className={cn(
        "rounded-control border transition-[color,background-color,border-color] duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-(--selected-border) bg-(--selected-bg) text-(--selected-fg)" : IDLE[variant],
        className
      )}
      {...props}
    />
  );
}
