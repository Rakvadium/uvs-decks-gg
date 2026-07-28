import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileSheetFooter() {
  const { isAuthenticated, isLoading, handleAuthClick, handleSignOut, closeSheet } = useMobileProfileSheetContext();

  return (
    <div className="shrink-0 border-t bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
