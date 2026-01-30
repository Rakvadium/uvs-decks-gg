"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { UIStateProvider, ActiveDeckProvider } from "@/providers";
import {
  LeftSidebar,
  TopHeader,
  RightSidebar,
  ShellSlotProvider,
  useShellSlot,
  useRegisterSlot,
  MobileShellProvider,
  MobileHeader,
  MobileTopBar,
  MobileBottomNav,
  MobileProfileSheet,
  MobileActionsSheet,
  MobileActionsTrigger,
} from "@/components/shell";
import { usePathname, useParams } from "next/navigation";
import { Upload, Layers, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import { TcgDndProvider } from "@/lib/dnd";
import { GalleryFiltersProvider } from "@/providers/GalleryFiltersProvider";

const LEFT_SIDEBAR_KEY = "uvs-decks-left-sidebar-collapsed";

export type PageType = "gallery" | "decks" | "deckDetails" | "collection" | "community" | "home" | "admin" | "settings";

function getPageType(pathname: string): PageType | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/settings") return "settings";
  if (pathname.includes("/gallery")) return "gallery";
  if (pathname.includes("/decks/") && pathname.split("/decks/")[1]) return "deckDetails";
  if (pathname.includes("/decks")) return "decks";
  if (pathname.includes("/collection")) return "collection";
  if (pathname.includes("/community")) return "community";
  if (pathname.includes("/home")) return "home";
  return null;
}

function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link 
          href="/admin" 
          className={`block px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname === "/admin" ? "bg-muted font-medium" : ""}`}
        >
          Dashboard
        </Link>
      </div>

      <div className="border-t pt-4">
        <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Management
        </p>
        <div className="space-y-1">
          <Link 
            href="/admin/cards"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname.includes("/cards") ? "bg-muted font-medium" : ""}`}
          >
            <CreditCard className="h-4 w-4" />
            Cards
          </Link>
          <Link 
            href="/admin/sets"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname.includes("/sets") ? "bg-muted font-medium" : ""}`}
          >
            <Layers className="h-4 w-4" />
            Sets
          </Link>
          <Link 
            href="/admin/import"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname.includes("/import") ? "bg-muted font-medium" : ""}`}
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminSidebarSlot() {
  return <AdminSidebarContent />;
}

function AdminSidebarSlotRegistration() {
  const slotOptions = useMemo(
    () => ({ label: "Admin Navigation", icon: Settings }),
    []
  );
  useRegisterSlot("right-sidebar", "admin-nav", AdminSidebarSlot, slotOptions);
  return null;
}

function ShellLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { state } = useShellSlot();

  const pageType = getPageType(pathname);
  const deckId = params?.deckId as string | undefined;

  useEffect(() => {
    const stored = localStorage.getItem(LEFT_SIDEBAR_KEY);
    if (stored !== null) {
      setLeftSidebarCollapsed(stored === "true");
    }
    setIsHydrated(true);
  }, []);

  const hasRightSidebar = (state.slots.get("right-sidebar")?.length ?? 0) > 0;

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LEFT_SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const desktopLayout = (
    <div className="hidden md:flex h-screen w-full flex-col overflow-hidden">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden bg-sidebar">
        <LeftSidebar
          collapsed={isHydrated ? leftSidebarCollapsed : false}
          onToggle={toggleLeftSidebar}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex flex-1 flex-col min-w-0">
            <div className="pointer-events-none absolute -top-3 left-0 z-10 h-3 w-3">
              <div className="h-full w-full rounded-br-xl bg-sidebar" />
            </div>
            {!hasRightSidebar && (
              <div className="pointer-events-none absolute -top-3 right-0 z-10 h-3 w-3">
                <div className="h-full w-full rounded-bl-xl bg-sidebar" />
              </div>
            )}
            <main className="flex-1 overflow-hidden rounded-tl-xl bg-background">
              {children}
            </main>
          </div>
          {hasRightSidebar && <RightSidebar />}
        </div>
      </div>
    </div>
  );

  const mobileLayout = (
    <MobileShellProvider>
      <div className="flex md:hidden h-[100dvh] w-full flex-col bg-background relative">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
        <MobileActionsTrigger />
        <MobileTopBar pageType={pageType} deckId={deckId} />
        <MobileBottomNav />
        <MobileProfileSheet />
        <MobileActionsSheet />
      </div>
    </MobileShellProvider>
  );

  const content = (
    <>
      {pageType === "admin" ? <AdminSidebarSlotRegistration /> : null}
      {desktopLayout}
      {mobileLayout}
    </>
  );

  if (pageType === "gallery") {
    return <GalleryFiltersProvider>{content}</GalleryFiltersProvider>;
  }

  return content;
}

function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ShellLayoutInner>{children}</ShellLayoutInner>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <UIStateProvider>
        <ActiveDeckProvider>
          <TcgDndProvider>
            <ShellSlotProvider>
              <ShellLayout>{children}</ShellLayout>
            </ShellSlotProvider>
          </TcgDndProvider>
        </ActiveDeckProvider>
      </UIStateProvider>
    </AuthGuard>
  );
}
