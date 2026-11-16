import { UserAvatar } from "@/components/user-avatar";
import { useMobileProfileSheetContext } from "./context";
import { sectionHeadingVariants } from "@/components/ui/typography-headings";
import { cn } from "@/lib/utils";

export function MobileProfileSheetHeader() {
  const { user, isAuthenticated } = useMobileProfileSheetContext();

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-4 pt-2 text-center">
      <UserAvatar
        username={user?.username}
        image={user?.image}
        alt={user?.username || "User"}
        className="size-16 border border-surface shadow-[var(--chrome-shell-avatar-ring)]"
        fallbackClassName="bg-primary-selected text-xl font-semibold text-primary"
      />
      <div className="flex min-w-0 flex-col">
        <p className={cn(sectionHeadingVariants({ size: "md" }), "truncate text-foreground")}>
          {user?.username || (isAuthenticated ? "Loading…" : "Guest")}
        </p>
        <p className="truncate text-sm text-muted-foreground">{user?.email || "Not signed in"}</p>
      </div>
    </div>
  );
}
