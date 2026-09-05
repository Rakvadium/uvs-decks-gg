import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_BOTTOM } from "../mobile-glass";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileSheetFooter() {
  const { isAuthenticated, isLoading, handleAuthClick, handleSignOut, closeSheet } =
    useMobileProfileSheetContext();

  if (isLoading) {
    return <div className={cn("shrink-0", MOBILE_SAFE_BOTTOM)} />;
  }

  return (
    <div className={cn("shrink-0 border-t border-border/30 px-4 pt-3", MOBILE_SAFE_BOTTOM)}>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl text-[15px]" onClick={closeSheet}>
          Close
        </Button>
        {!isAuthenticated ? (
          <Button type="button" className="h-11 flex-1 gap-2 rounded-xl text-[15px]" onClick={handleAuthClick}>
            <LogIn className="size-4" />
            Sign In
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 gap-2 rounded-xl text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        )}
      </div>
    </div>
  );
}
