import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/components/auth/auth-dialog";

export function DecksAuthRequiredState() {
  const { openAuthDialog } = useAuthDialog();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border border-primary/30" style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}>
          <Lock className="h-10 w-10 text-primary/50" />
        </div>
        <p className="font-mono text-muted-foreground uppercase tracking-wider">Sign in to view your decks</p>
        <Button variant="default" className="mt-4" onClick={openAuthDialog}>
          Sign In
        </Button>
      </div>
    </div>
  );
}
