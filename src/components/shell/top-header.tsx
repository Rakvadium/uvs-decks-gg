"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Layers,
  Home,
  LayoutGrid,
  Library,
  Users,
  LogIn,
  Moon,
  Sun,
  Palette,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme, useColorScheme, COLOR_SCHEMES } from "@/lib/theme";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { AdminTopBarContent } from "@/components/admin/admin-top-bar-context";
import { PageType } from "@/app/(app)/layout";

const navItems = [
  { path: "gallery", label: "Cards", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
];

interface TopHeaderProps {
  pageType?: PageType | null;
  deckId?: string;
}

export function TopHeader({ pageType, deckId }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnAdminPage = pathname.startsWith("/admin");
  const authActions = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isDark, toggleTheme } = useTheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { openAuthDialog } = useAuthDialog();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const isAdmin = user?.role === "Admin";

  const handleSignOut = async () => {
    if (authActions?.signOut) {
      await authActions.signOut();
      router.push("/");
    }
  };

  const renderTopBar = () => {
    if (pageType === "admin") {
      return <AdminTopBarContent />;
    }

    return null;
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center bg-sidebar border-b border-sidebar-border px-4">
      {/* Logo on the left */}
      <div className="flex items-center gap-2 z-10">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="whitespace-nowrap text-lg font-semibold text-sidebar-foreground">
            UVS DECKS
          </span>
        </Link>
      </div>

      {/* Navigation items center-aligned - absolutely positioned */}
      {!isOnAdminPage && (
        <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const href = `/${item.path}`;
              const isActive = pathname.includes(`/${item.path}`);
              const Icon = item.icon;

              return (
                <Link key={item.path} href={href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Admin content center-aligned - absolutely positioned */}
      {isOnAdminPage && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {renderTopBar()}
        </div>
      )}

      {/* User profile/sign-in on the right */}
      <div className="flex items-center gap-2 ml-auto z-10">
        {!isLoading && !isAuthenticated ? (
          <Button
            variant="ghost"
            onClick={openAuthDialog}
            className="text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium">Sign In</span>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-2"
              >
                <Avatar className="h-8 w-8">
                  {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username || "User"}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{user?.email || "Not signed in"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg"
              align="end"
              side="bottom"
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
    </header>
  );
}
