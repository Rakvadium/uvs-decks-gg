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
  Hexagon,
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
      <div className={cn("px-3 pt-4 pb-2", collapsed ? "flex justify-center" : "")}>
        <Link href="/home" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-primary/20 border border-primary/40 shadow-[0_0_8px_-2px_var(--primary)] group-hover:shadow-[0_0_12px_-2px_var(--primary)] transition-shadow duration-300" />
            <Hexagon className="relative h-5 w-5 text-primary drop-shadow-[0_0_3px_var(--primary)]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="whitespace-nowrap text-lg font-display font-bold tracking-widest text-foreground uppercase">
                UVS<span className="text-primary">DECKS</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-[0.3em] uppercase -mt-1">
                .GG
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="px-3 py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </div>

      <div className={cn("px-2 pb-2", collapsed && "flex justify-center")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-full text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono uppercase tracking-wider text-xs">
              Expand
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={onToggle}
            className="w-full justify-start gap-3 px-3 text-sidebar-foreground/60 hover:bg-primary/10 hover:text-primary font-mono uppercase tracking-wider text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </Button>
        )}
      </div>

      <div className="px-3 py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {!isOnAdminPage && navItems.map((item, index) => {
          const href = `/${item.path}`;
          const isActive = pathname.includes(`/${item.path}`);
          const Icon = item.icon;

          const navLink = (
            <Link key={item.path} href={href}>
              <motion.div
                initial={false}
                whileHover={prefersReducedMotion ? undefined : { x: collapsed ? 0 : 4 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/15 text-primary shadow-[0_0_10px_-5px_var(--primary)] border border-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border border-transparent hover:border-sidebar-border/50"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200",
                  isActive && "drop-shadow-[0_0_4px_var(--primary)]"
                )} />
                {!collapsed && (
                  <span className="whitespace-nowrap font-mono uppercase tracking-wider text-xs">
                    {item.label}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-md border border-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-mono uppercase tracking-wider text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navLink;
        })}

        {isOnAdminPage && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-sm font-semibold",
            collapsed && "justify-center px-2"
          )}>
            <Shield className="h-4 w-4 shrink-0 text-primary drop-shadow-[0_0_8px_var(--primary)]" />
            {!collapsed && (
              <span className="whitespace-nowrap font-display uppercase tracking-widest text-xs text-primary">
                Admin Panel
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />
      </nav>

      <div className="px-3 py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </div>

      <div className={cn("p-2", collapsed && "flex flex-col items-center")}>
        {!isLoading && !isAuthenticated ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={openAuthDialog}
                className={cn(
                  "w-full border-primary/30 hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
                  collapsed ? "h-10 w-10 p-0" : "h-12 justify-start gap-3 px-3"
                )}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-mono uppercase tracking-wider text-xs">Sign In</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-mono uppercase tracking-wider text-xs">
                Sign In
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-sidebar-foreground hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/15 data-[state=open]:text-primary border border-transparent hover:border-primary/30 data-[state=open]:border-primary/30",
                  collapsed ? "h-10 w-10 p-0" : "h-14 justify-start gap-3 px-3"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-primary/30 shadow-[0_0_10px_-3px_var(--primary)]">
                  {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-mono font-bold">
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium font-mono uppercase tracking-wide text-xs">{user?.username || "User"}</span>
                    <span className="truncate text-xs text-sidebar-foreground/50 font-mono">{user?.email || "Not signed in"}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg border-primary/20 bg-popover/95 backdrop-blur-lg"
              align="start"
              side={collapsed ? "right" : "top"}
              sideOffset={4}
            >
              <DropdownMenuItem onClick={toggleTheme} className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary">
                {isDark ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {isDark ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary">
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={colorScheme} onValueChange={(value) => setColorScheme(value as typeof colorScheme)}>
                    {COLOR_SCHEMES.map((scheme) => (
                      <DropdownMenuRadioItem 
                        key={scheme.value} 
                        value={scheme.value}
                        className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        {scheme.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => router.push("/settings")} className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {isOnAdminPage ? (
                    <DropdownMenuItem onClick={() => router.push("/")} className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary">
                      <Home className="mr-2 h-4 w-4" />
                      Back to App
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => router.push("/admin")} className="font-mono uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleSignOut} className="font-mono uppercase tracking-wider text-xs hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
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
          className="relative flex h-full flex-col overflow-hidden bg-sidebar border-r border-sidebar-border/50"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative z-10 flex h-full flex-col">
            {sidebarContent}
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="expanded"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
          className="relative flex h-full flex-col overflow-hidden bg-sidebar border-r border-sidebar-border/50"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative z-10 flex h-full flex-col">
            {sidebarContent}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
