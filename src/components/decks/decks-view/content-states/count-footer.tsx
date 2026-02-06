import type { DecksCountFooterProps } from "./types";

export function DecksCountFooter({ count }: DecksCountFooterProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-center pt-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
        Showing {count} deck{count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
