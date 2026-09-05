"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { UserRound } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { useMobileShell } from "../mobile-shell-context";
import { MOBILE_TAB_ICON_CLASS } from "./metrics";

interface MobileProfileTabProps {
  className: string;
}

export function MobileProfileTab({ className }: MobileProfileTabProps) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const { isProfileSheetOpen, setProfileSheetOpen } = useMobileShell();
  const { openAuthDialog } = useAuthDialog();

  return (
    <button
      type="button"
      aria-label={isAuthenticated ? "Profile" : "Sign in"}
      aria-haspopup="dialog"
      aria-expanded={isProfileSheetOpen}
      onClick={() => {
        if (isAuthenticated) {
          setProfileSheetOpen(true);
          return;
        }
        openAuthDialog();
      }}
      className={cn(
        className,
        isProfileSheetOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {isAuthenticated ? (
        <UserAvatar
          username={user?.username}
          image={user?.image}
          alt={user?.username || "User"}
          className={cn(
            "size-6 border border-border/50 shadow-[var(--chrome-shell-avatar-ring)] motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90",
            isProfileSheetOpen && "ring-2 ring-primary/60"
          )}
          fallbackClassName="bg-primary/20 text-[10px] font-bold text-primary"
        />
      ) : (
        <UserRound
          className={cn(
            MOBILE_TAB_ICON_CLASS,
            "shrink-0 motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90"
          )}
          strokeWidth={2}
        />
      )}
    </button>
  );
}
