import { LogIn, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileSheetFooter() {
  const { isAuthenticated, isLoading, handleAuthClick, handleSignOut, closeSheet } = useMobileProfileSheetContext();

  return (
    <div className="shrink-0 border-t bg-background p-4">
      {!isLoading && !isAuthenticated ? (
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 font-mono text-sm font-bold text-primary">?</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Guest</p>
            <p className="text-xs text-muted-foreground">Not signed in</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={closeSheet}>
          Close
        </Button>
        {!isLoading && !isAuthenticated ? (
          <Button variant="default" className="gap-2" onClick={handleAuthClick}>
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        ) : isAuthenticated ? (
          <Button
            variant="ghost"
            className="gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        ) : null}
      </div>
    </div>
  );
}
