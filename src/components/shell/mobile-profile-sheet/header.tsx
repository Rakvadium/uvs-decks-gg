import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user-avatar";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileSheetHeader() {
  const { user } = useMobileProfileSheetContext();

  return (
    <SheetHeader className="shrink-0 p-4 pb-2 pr-12">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user?.image ? <AvatarImage src={user.image} alt={user.username || "User"} /> : null}
          <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <SheetTitle className="truncate text-left">{user?.username || "Guest"}</SheetTitle>
          <span className="truncate text-sm text-muted-foreground">{user?.email || "Not signed in"}</span>
        </div>
      </div>
    </SheetHeader>
  );
}
