import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useColorScheme, useTheme } from "@/lib/theme";
import { NAV_ITEMS } from "./constants";

interface LeftSidebarContextValue {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
  isOnAdminPage: boolean;
  navItems: typeof NAV_ITEMS;
  prefersReducedMotion: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  colorScheme: ReturnType<typeof useColorScheme>["colorScheme"];
  setColorScheme: ReturnType<typeof useColorScheme>["setColorScheme"];
  openAuthDialog: () => void;
  user: ReturnType<typeof useQuery<typeof api.user.currentUser>>;
  isAdmin: boolean;
  navigateTo: (path: string) => void;
  handleSignOut: () => Promise<void>;
}

const LeftSidebarContext = createContext<LeftSidebarContextValue | null>(null);

interface LeftSidebarProviderProps {
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function LeftSidebarProvider({ collapsed, onToggle, children }: LeftSidebarProviderProps) {
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

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    if (!authActions?.signOut) return;
    await authActions.signOut();
    router.push("/");
  }, [authActions, router]);

  const value = useMemo(
    () => ({
      collapsed,
      onToggle,
      pathname,
      isOnAdminPage,
      navItems: NAV_ITEMS,
      prefersReducedMotion,
      isLoading,
      isAuthenticated,
      isDark,
      toggleTheme,
      colorScheme,
      setColorScheme,
      openAuthDialog,
      user,
      isAdmin,
      navigateTo,
      handleSignOut,
    }),
    [
      collapsed,
      onToggle,
      pathname,
      isOnAdminPage,
      prefersReducedMotion,
      isLoading,
      isAuthenticated,
      isDark,
      toggleTheme,
      colorScheme,
      setColorScheme,
      openAuthDialog,
      user,
      isAdmin,
      navigateTo,
      handleSignOut,
    ]
  );

  return <LeftSidebarContext.Provider value={value}>{children}</LeftSidebarContext.Provider>;
}

export function useLeftSidebarContext() {
  const context = useContext(LeftSidebarContext);
  if (!context) {
    throw new Error("useLeftSidebarContext must be used within LeftSidebarProvider");
  }
  return context;
}
