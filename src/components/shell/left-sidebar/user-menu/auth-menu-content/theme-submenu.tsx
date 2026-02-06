import { Moon, Palette, Sun } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_SCHEMES } from "@/lib/theme";
import { useLeftSidebarContext } from "../../context";
import { MENU_ITEM_CLASS } from "./constants";

export function LeftSidebarThemeControls() {
  const { colorScheme, isDark, setColorScheme, toggleTheme } = useLeftSidebarContext();

  return (
    <>
      <DropdownMenuItem onClick={toggleTheme} className={MENU_ITEM_CLASS}>
        {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
        {isDark ? "Light Mode" : "Dark Mode"}
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={MENU_ITEM_CLASS}>
          <Palette className="mr-2 h-4 w-4" />
          Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={colorScheme}
            onValueChange={(value) => setColorScheme(value as typeof colorScheme)}
          >
            {COLOR_SCHEMES.map((scheme) => (
              <DropdownMenuRadioItem key={scheme.value} value={scheme.value} className={MENU_ITEM_CLASS}>
                {scheme.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
