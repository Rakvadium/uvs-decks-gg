"use client";

import { ReactNode, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthGuard } from "@/components/auth-guard";
import {
  UIStateProvider,
  ActiveDeckProvider,
  DeckCollaborationProvider,
  DeckDetailsProvider,
} from "@/providers";
import { UniversusMediaDockProvider } from "@/providers/UniversusMediaDockProvider";
import {
  ShellSlotProvider,
  useShellSlotSlots,
  useRegisterSlot,
  MobileShellProvider,
  MobileHeader,
  MobileTopBar,
  MobileBottomNav,
  MobileProfileSheet,
  MobileActionsSheet,
} from "@/components/shell";
import { usePathname, useParams } from "next/navigation";
import {
  Upload,
  Layers,
  CreditCard,
  Settings,
  BookOpen,
  Newspaper,
  Users,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { TcgDndProvider } from "@/lib/dnd";
import { SiloedDeckProvider } from "@/lib/deck";
import { cn } from "@/lib/utils";
import { GalleryFiltersProvider } from "@/providers/GalleryFiltersProvider";
import { DecksProvider } from "@/providers/DecksProvider";
import { CommunityTierListsPageProvider } from "@/components/community/tier-lists/page-view/context";
import { CommunityTierListDetailProvider } from "@/components/community/tier-lists/detail-view/context";
import { AccountStatusBanner } from "@/components/shell/account-status-banner";
import { FeedbackDialogProvider } from "@/components/shell/feedback-dialog-provider";

const LeftSidebar = dynamic(
  () => import("@/components/shell").then((module) => module.LeftSidebar),
  { ssr: false }
);

function loadRightSidebarShell() {
  return import("@/components/shell").then((module) => module.RightSidebar);
}

const RightSidebar = dynamic(() => loadRightSidebarShell(), { ssr: false });

const LEFT_SIDEBAR_KEY = "uvs-decks-left-sidebar-collapsed";

const SHOW_DESKTOP_RIGHT_SIDEBAR = true;
const SHOW_DESKTOP_LEFT_SIDEBAR = true;

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
  const params = useParams();
  const setCode =
    typeof params?.code === "string" ? params.code : undefined;
  const setOverviewHref = setCode
    ? `/admin/sets/${encodeURIComponent(setCode)}`
    : null;
  const setCardsHref = setCode
    ? `/admin/sets/${encodeURIComponent(setCode)}/cards`
    : null;
  const setReviewHref = setCode
    ? `/admin/sets/${encodeURIComponent(setCode)}/review`
    : null;
  const setImportHref = setCode
    ? `/admin/sets/${encodeURIComponent(setCode)}/import`
    : null;
  const showSetNav =
    Boolean(setCode) &&
    /^\/admin\/sets\/[^/]+/.test(pathname) &&
    pathname !== "/admin/sets";

  const setsAreaActive =
    pathname === "/admin/sets" || pathname.startsWith("/admin/sets/");
  const formatsActive = pathname.startsWith("/admin/formats");
  const contentAreaActive =
    pathname.startsWith("/admin/content") ||
    pathname.startsWith("/admin/moderation") ||
    pathname.startsWith("/admin/ui-matrix");
  const usersActive = pathname.startsWith("/admin/users");
  const feedbackActive = pathname.startsWith("/admin/feedback");

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

      {showSetNav && setOverviewHref && setCardsHref && setReviewHref && setImportHref ? (
        <div className="rounded-md border bg-muted/30 p-2 space-y-1">
          <Link
            href="/admin/sets"
            className="block px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            ← All sets
          </Link>
          <p className="px-2 pt-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Set · <span className="font-mono normal-case">{setCode}</span>
          </p>
          <Link
            href={setOverviewHref}
            className={`block px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname === setOverviewHref ? "bg-muted font-medium" : ""}`}
          >
            Overview
          </Link>
          <Link
            href={setCardsHref}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname === setCardsHref ? "bg-muted font-medium" : ""}`}
          >
            <CreditCard className="h-4 w-4" />
            Cards
          </Link>
          <Link
            href={setReviewHref}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname === setReviewHref ? "bg-muted font-medium" : ""}`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Review
          </Link>
          <Link
            href={setImportHref}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${pathname === setImportHref ? "bg-muted font-medium" : ""}`}
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
        </div>
      ) : null}

      <div className="border-t pt-4">
        <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Catalog
        </p>
        <div className="space-y-1">
          <Link
            href="/admin/sets"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${setsAreaActive ? "bg-muted font-medium" : ""}`}
          >
            <Layers className="h-4 w-4" />
            Sets
          </Link>
          <Link
            href="/admin/formats"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${formatsActive ? "bg-muted font-medium" : ""}`}
          >
            <BookOpen className="h-4 w-4" />
            Formats
          </Link>
          <Link
            href="/admin/content"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${contentAreaActive ? "bg-muted font-medium" : ""}`}
          >
            <Newspaper className="h-4 w-4" />
            Content
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${usersActive ? "bg-muted font-medium" : ""}`}
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
          <Link
            href="/admin/feedback"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted ${feedbackActive ? "bg-muted font-medium" : ""}`}
          >
            <MessageSquare className="h-4 w-4" />
            User feedback
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
  const shellSlots = useShellSlotSlots();

  const pageType = getPageType(pathname);
  const deckId = params?.deckId as string | undefined;
  const tierListId = params?.tierListId as string | undefined;

  useEffect(() => {
    if (!SHOW_DESKTOP_RIGHT_SIDEBAR) return;
    if (
      pageType !== "gallery" &&
      pageType !== "deckDetails" &&
      pageType !== "admin" &&
      pageType !== "community"
    ) {
      return;
    }
    void loadRightSidebarShell();
  }, [pageType]);

  const hasRightSidebar =
    SHOW_DESKTOP_RIGHT_SIDEBAR && (shellSlots.get("right-sidebar")?.length ?? 0) > 0;

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LEFT_SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const desktopLayout = (
    <div className="hidden md:flex h-screen w-full overflow-hidden">
      {SHOW_DESKTOP_LEFT_SIDEBAR ? (
        <LeftSidebar
          collapsed={leftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
        />
      ) : null}
      <div className="flex flex-1 flex-col overflow-hidden bg-sidebar">
        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex flex-1 flex-col min-w-0">
            {SHOW_DESKTOP_LEFT_SIDEBAR ? (
              <div className="pointer-events-none absolute -top-3 left-0 z-10 h-3 w-3">
                <div className="h-full w-full rounded-br-xl bg-sidebar" />
              </div>
            ) : null}
            {!hasRightSidebar ? (
              <div className="pointer-events-none absolute -top-3 right-0 z-10 h-3 w-3">
                <div className="h-full w-full rounded-bl-xl bg-sidebar" />
              </div>
            ) : null}
            <main
              className={cn(
                "min-h-0 flex-1 flex flex-col overflow-hidden bg-background",
              )}
              style={{ backgroundImage: "var(--chrome-page-bg)" }}
            >
              <AccountStatusBanner />
              <div
                className={cn(
                  "min-h-0 flex-1",
                  pathname.startsWith("/admin")
                    ? "overflow-y-auto overflow-x-hidden"
                    : "overflow-hidden"
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      {hasRightSidebar ? <RightSidebar /> : null}
    </div>
  );

  const mobileLayout = (
    <MobileShellProvider>
      <div className="flex md:hidden h-[100dvh] min-h-0 w-full flex-col bg-background relative">
        <MobileHeader />
        <main
          className="max-md:min-h-0 flex min-h-0 flex-1 flex-col overflow-y-auto bg-background"
          style={{
            backgroundImage: "var(--chrome-page-bg)",
          }}
        >
          <AccountStatusBanner />
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </main>
        <div className="relative z-40 shrink-0 border-t border-border/35">
          <MobileActionsSheet>
            <MobileTopBar pageType={pageType} />
            <MobileBottomNav />
          </MobileActionsSheet>
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
          <DeckDetailsProvider deckId={deckId}>
          <DeckCollaborationProvider>{content}</DeckCollaborationProvider>
        </DeckDetailsProvider>
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
              <UniversusMediaDockProvider>
              <FeedbackDialogProvider>
                <ShellLayout>{children}</ShellLayout>
              </FeedbackDialogProvider>
              </UniversusMediaDockProvider>
            </ShellSlotProvider>
          </TcgDndProvider>
        </ActiveDeckProvider>
      </UIStateProvider>
    </AuthGuard>
  );
}
