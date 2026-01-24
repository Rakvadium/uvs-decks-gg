"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "single";
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ToggleGroup({
  type,
  value,
  onValueChange,
  className,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider
      value={{
        value,
        onValueChange: onValueChange ?? (() => {}),
      }}
    >
      <div
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg border bg-muted p-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function ToggleGroupItem({
  value,
  className,
  children,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("ToggleGroupItem must be used within ToggleGroup");
  }

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        "hover:bg-background/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-background text-foreground shadow-sm",
        !isSelected && "text-muted-foreground",
        className
      )}
      onClick={() => context.onValueChange(value)}
      data-state={isSelected ? "on" : "off"}
      {...props}
    >
      {children}
    </button>
  );
}
