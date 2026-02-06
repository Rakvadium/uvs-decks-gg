import { Home, Shield } from "lucide-react";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileAdminSection() {
  const { isOnAdminPage, handleAdminToggle } = useMobileProfileSheetContext();

  return (
    <div className="p-4 pb-24">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Admin</p>
      <button
        onClick={handleAdminToggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {isOnAdminPage ? (
          <>
            <Home className="h-5 w-5" />
            <span>Back to App</span>
          </>
        ) : (
          <>
            <Shield className="h-5 w-5" />
            <span>Admin Panel</span>
          </>
        )}
      </button>
    </div>
  );
}
