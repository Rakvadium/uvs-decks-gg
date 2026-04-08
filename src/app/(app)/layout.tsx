"use client";

import { ReactNode, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { AuthGuard } from "@/components/auth-guard";
import { UIStateProvider, ActiveDeckProvider, DeckDetailsProvider } from "@/providers";
import {
  TopHeader,
  ShellSlotProvider,
  useShellSlot,
  useRegisterSlot,
  MobileShellProvider,
  MobileHeader,
  MobileTopBar,
  MobileBottomNav,
  MobileProfileSheet,
  MobileActionsSheet,
} from "@/components/shell";
import { usePathname, useParams } from "next/navigation";
import { Upload, Layers, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import { TcgDndProvider } from "@/lib/dnd";
import { SiloedDeckProvider } from "@/lib/deck";
import { GalleryFiltersProvider } from "@/providers/GalleryFiltersProvider";
import { DecksProvider } from "@/providers/DecksProvider";
import { CommunityTierListsPageProvider } from "@/components/community/tier-lists/page-view/context";
import { CommunityTierListDetailProvider } from "@/components/community/tier-lists/detail-view/context";

const LeftSidebar = dynamic(
  () => import("@/components/shell").then((module) => module.LeftSidebar),
  { ssr: false }
);
const RightSidebar = dynamic(
  () => import("@/components/shell").then((module) => module.RightSidebar),
  { ssr: false }
);

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
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(LEFT_SIDEBAR_KEY);
    return stored === "true";
  });
  const { state } = useShellSlot();

  const pageType = getPageType(pathname);
  const deckId = params?.deckId as string | undefined;
  const tierListId = params?.tierListId as string | undefined;

  const hasRightSidebar = (state.slots.get("right-sidebar")?.length ?? 0) > 0;

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LEFT_SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const desktopLayout = (
    <div className="hidden md:flex h-screen w-full overflow-hidden">
      <LeftSidebar
        collapsed={leftSidebarCollapsed}
        onToggle={toggleLeftSidebar}
      />
      <div className="flex flex-1 flex-col overflow-hidden bg-sidebar">
        <TopHeader />
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
        </div>
      </div>
      {hasRightSidebar && <RightSidebar />}
    </div>
  );

  const mobileLayout = (
    <MobileShellProvider>
      <div className="flex md:hidden h-[100dvh] w-full flex-col bg-background relative">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="min-h-full pb-[calc(env(safe-area-inset-bottom)+11rem)]">
            {children}
          </div>
        </main>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-transparent ">
          <div className="relative pointer-events-auto overflow-visible">
            <MobileActionsSheet>
              <MobileTopBar pageType={pageType} />
              <MobileBottomNav />
            </MobileActionsSheet>
          </div>
        </div>
        <MobileProfileSheet />
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

  if (pageType === "decks") {
    return <DecksProvider>{content}</DecksProvider>;
  }

  if (pageType === "deckDetails" && deckId) {
    return (
      <GalleryFiltersProvider>
        <SiloedDeckProvider deckId={deckId}>
          <DeckDetailsProvider deckId={deckId}>{content}</DeckDetailsProvider>
        </SiloedDeckProvider>
      </GalleryFiltersProvider>
    );
  }

  if (pathname === "/community/tier-lists") {
    return <CommunityTierListsPageProvider>{content}</CommunityTierListsPageProvider>;
  }

  if (pathname.startsWith("/community/tier-lists/") && tierListId) {
    return (
      <CommunityTierListDetailProvider tierListId={tierListId}>
        {content}
      </CommunityTierListDetailProvider>
    );
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
