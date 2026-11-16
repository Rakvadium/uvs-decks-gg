import type React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CardFlipButtonProps extends React.ComponentProps<typeof Button> {
  onFlip?: () => void;
}

export function CardFlipButton({ className, onFlip, ...props }: CardFlipButtonProps) {
  return (
    <Button
      shape="tab-tl"
      data-slot="card-flip-button"
      size="icon-xs"
      variant="default"
      className={cn(
        "absolute left-0 top-0 z-20 border border-primary/80 bg-primary/60 text-primary-foreground opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 hover:bg-primary/80 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100",
        className
      )}
      onClick={(event) => {
        onFlip?.();
        props.onClick?.(event);
      }}
      {...props}
    >
      <RotateCcw className="h-3 w-3" />
      <span className="sr-only">Flip card</span>
    </Button>
  );
}
