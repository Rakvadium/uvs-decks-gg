import { COLOR_SCHEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Moon, Palette, Settings, Sun } from "lucide-react";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfilePreferencesSection() {
  const {
    isDark,
    colorScheme,
    setColorScheme,
    handleToggleTheme,
    handleSettingsClick,
  } = useMobileProfileSheetContext();

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferences</p>
      <div className="space-y-1">
        <button
          onClick={handleToggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>

        <div className="space-y-2 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Palette className="h-5 w-5" />
            <span>Theme</span>
          </div>
          <div className="ml-8 flex flex-wrap gap-2">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  colorScheme === scheme.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
              >
                {scheme.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSettingsClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
