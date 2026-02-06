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
      data-slot="card-flip-button"
      size="icon"
      variant="default"
      className={cn(
        "absolute left-0 top-0 z-20 h-7 w-7 rounded-bl-none rounded-br-md rounded-tl-md rounded-tr-none border border-primary/80 bg-primary/60 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 hover:bg-primary/80 group-hover:opacity-100",
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
