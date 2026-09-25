import { UserRoundPen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Top-right "Change Character" corner button. */
export function UvsChangeCharacterButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Change starting character"
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className={cn(
            "absolute right-0 top-0 z-20 flex h-8 w-8 items-center justify-center",
            "rounded-tr-lg rounded-bl-lg rounded-tl-none rounded-br-none",
            "bg-background/80 backdrop-blur-sm",
            "border-l border-b border-border/40",
            "transition-colors hover:bg-primary/10 hover:border-primary/40"
          )}
        >
          <UserRoundPen className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="chrome-label-case text-xs">
        <p>Change Character</p>
      </TooltipContent>
    </Tooltip>
  );
}
