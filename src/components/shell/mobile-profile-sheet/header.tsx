import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileSheetHeader() {
  const { user, closeSheet } = useMobileProfileSheetContext();

  return (
    <SheetHeader className="shrink-0 p-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {user?.image ? <AvatarImage src={user.image} alt={user.username || "User"} /> : null}
            <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <SheetTitle className="text-left">{user?.username || "Guest"}</SheetTitle>
            <span className="text-sm text-muted-foreground">{user?.email || "Not signed in"}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={closeSheet} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </SheetHeader>
  );
}
