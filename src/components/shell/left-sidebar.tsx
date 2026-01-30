"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutGrid,
  Layers,
  Library,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Moon,
  Sun,
  Palette,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme, useColorScheme, COLOR_SCHEMES } from "@/lib/theme";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { path: "home", label: "Home", icon: Home },
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];

interface LeftSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function LeftSidebar({ collapsed, onToggle }: LeftSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnAdminPage = pathname.startsWith("/admin");
  const authActions = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isDark, toggleTheme } = useTheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { openAuthDialog } = useAuthDialog();
  const prefersReducedMotion = usePrefersReducedMotion();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const isAdmin = user?.role === "Admin";

  const handleSignOut = async () => {
    if (authActions?.signOut) {
      await authActions.signOut();
      router.push("/");
    }
  };

  const sidebarContent = (
    <>
      <div className={cn("px-2 pt-2 pb-2", collapsed && "flex justify-center")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={onToggle}
            className="w-full justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-2">
        {!isOnAdminPage && navItems.map((item) => {
          const href = `/${item.path}`;
          const isActive = pathname.includes(`/${item.path}`);
          const Icon = item.icon;

          const navLink = (
            <Link key={item.path} href={href}>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { x: collapsed ? 0 : 2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </motion.div>
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return navLink;
        })}

        {isOnAdminPage && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-semibold text-sidebar-foreground",
            collapsed && "justify-center px-2"
          )}>
            <Shield className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <span className="whitespace-nowrap">
                Admin Panel
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />
      </nav>

      <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex flex-col items-center")}>
        {!isLoading && !isAuthenticated ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={openAuthDialog}
                className={cn(
                  "w-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed ? "h-10 w-10 p-0" : "h-12 justify-start gap-3 px-3"
                )}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Sign In</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign In</TooltipContent>}
          </Tooltip>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                  collapsed ? "h-10 w-10 p-0" : "h-12 justify-start gap-3 px-3"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.username || "User"}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{user?.email || "Not signed in"}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg"
              align="start"
              side={collapsed ? "right" : "top"}
              sideOffset={4}
            >
              <DropdownMenuItem onClick={toggleTheme}>
                {isDark ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={colorScheme} onValueChange={(value) => setColorScheme(value as typeof colorScheme)}>
                    {COLOR_SCHEMES.map((scheme) => (
                      <DropdownMenuRadioItem key={scheme.value} value={scheme.value}>
                        {scheme.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  {isOnAdminPage ? (
                    <DropdownMenuItem onClick={() => router.push("/")}>
                      <Home className="mr-2 h-4 w-4" />
                      Back to App
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {collapsed ? (
        <motion.aside
          key="collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 64, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
          className="flex h-full flex-col overflow-hidden bg-sidebar"
        >
          {sidebarContent}
        </motion.aside>
      ) : (
        <motion.aside
          key="expanded"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
          className="flex h-full flex-col overflow-hidden bg-sidebar"
        >
          {sidebarContent}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
