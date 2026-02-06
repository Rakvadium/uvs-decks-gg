"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { useColorScheme, useTheme, type ColorScheme } from "@/lib/theme";
import { useMobileShell } from "../mobile-shell-context";

interface MobileProfileSheetContextValue {
  pathname: string;
  user: Doc<"users"> | null | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDark: boolean;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isAdmin: boolean;
  isOnAdminPage: boolean;
  isProfileSheetOpen: boolean;
  setProfileSheetOpen: (open: boolean) => void;
  closeSheet: () => void;
  handleSignOut: () => Promise<void>;
  handleNavClick: (path: string) => void;
  handleToggleTheme: () => void;
  handleSettingsClick: () => void;
  handleAuthClick: () => void;
  handleAdminToggle: () => void;
}

const MobileProfileSheetContext = createContext<MobileProfileSheetContextValue | null>(null);

export function MobileProfileSheetProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authActions = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isDark, toggleTheme } = useTheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { openAuthDialog } = useAuthDialog();
  const { isProfileSheetOpen, setProfileSheetOpen } = useMobileShell();

  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const isAdmin = user?.role === "Admin";
  const isOnAdminPage = pathname.startsWith("/admin");

  const closeSheet = useCallback(() => {
    setProfileSheetOpen(false);
  }, [setProfileSheetOpen]);

  const handleSignOut = useCallback(async () => {
    if (authActions?.signOut) {
      await authActions.signOut();
      closeSheet();
      router.push("/");
    }
  }, [authActions, closeSheet, router]);

  const handleNavClick = useCallback(
    (path: string) => {
      router.push(`/${path}`);
      closeSheet();
    },
    [closeSheet, router]
  );

  const handleSettingsClick = useCallback(() => {
    router.push("/settings");
    closeSheet();
  }, [closeSheet, router]);

  const handleAuthClick = useCallback(() => {
    openAuthDialog();
    closeSheet();
  }, [openAuthDialog, closeSheet]);

  const handleAdminToggle = useCallback(() => {
    router.push(isOnAdminPage ? "/" : "/admin");
    closeSheet();
  }, [closeSheet, isOnAdminPage, router]);

  const value = useMemo(
    (): MobileProfileSheetContextValue => ({
      pathname,
      user,
      isAuthenticated,
      isLoading,
      isDark,
      colorScheme,
      setColorScheme,
      isAdmin,
      isOnAdminPage,
      isProfileSheetOpen,
      setProfileSheetOpen,
      closeSheet,
      handleSignOut,
      handleNavClick,
      handleToggleTheme: toggleTheme,
      handleSettingsClick,
      handleAuthClick,
      handleAdminToggle,
    }),
    [
      pathname,
      user,
      isAuthenticated,
      isLoading,
      isDark,
      colorScheme,
      setColorScheme,
      isAdmin,
      isOnAdminPage,
      isProfileSheetOpen,
      setProfileSheetOpen,
      closeSheet,
      handleSignOut,
      handleNavClick,
      toggleTheme,
      handleSettingsClick,
      handleAuthClick,
      handleAdminToggle,
    ]
  );

  return <MobileProfileSheetContext.Provider value={value}>{children}</MobileProfileSheetContext.Provider>;
}

export function useMobileProfileSheetContext() {
  const context = useContext(MobileProfileSheetContext);
  if (!context) {
    throw new Error("useMobileProfileSheetContext must be used within MobileProfileSheetProvider");
  }

  return context;
}
