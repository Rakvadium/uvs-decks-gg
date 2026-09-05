"use client";

import { ReactNode, useState, useMemo, useEffect, type CSSProperties } from "react";
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
  MobileNavBar,
  MobileTabBar,
  MobileProfileSheet,
  MobileActionsSheet,
  useMobileShell,
} from "@/components/shell";
import { usePathname, useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Upload,
  Layers,
  CreditCard,
  Shield,
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
  if (pathname.startsWith("/gallery")) return "gallery";
  if (/^\/decks\/[^/]+/.test(pathname)) return "deckDetails";
  if (pathname === "/decks" || pathname.startsWith("/decks/")) return "decks";
  if (pathname.startsWith("/collection")) return "collection";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/home")) return "home";
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
        <div className="rounded-md border bg-muted/20 p-2 space-y-1">
          <Link
            href="/admin/sets"
            className="block px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            ← All sets
          </Link>
          <p className="chrome-label-case px-2 pt-1 text-xs font-medium text-muted-foreground">
            Set · <span className="normal-case">{setCode}</span>
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
        <p className="chrome-label-case px-3 text-xs font-medium text-muted-foreground mb-2">
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
    () => ({ label: "Admin Navigation", icon: Shield }),
    []
  );
  useRegisterSlot("right-sidebar", "admin-nav", AdminSidebarSlot, slotOptions);
  return null;
}

const MOBILE_SELF_SCROLLING_ROUTES = [
  /^\/gallery(\/|$)/,
  /^\/decks(\/|$)/,
  /^\/collection(\/|$)/,
  /^\/community(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/teams(\/(?!invite(\/|$))|$)/,
];

function routeScrollsItself(pathname: string): boolean {
  return MOBILE_SELF_SCROLLING_ROUTES.some((pattern) => pattern.test(pathname));
}

function MobileShellFrame({
  pathname,
  isMobile,
  children,
}: {
  pathname: string;
  isMobile: boolean;
  children: ReactNode;
}) {
  const { navBarHeight, tabBarHeight } = useMobileShell();
  const padsContent = !routeScrollsItself(pathname);

  return (
    <div
      className="relative flex md:hidden h-[100dvh] min-h-0 w-full flex-col bg-background"
      style={
        {
          "--mobile-nav-h": `${navBarHeight}px`,
          "--mobile-tab-h": `${tabBarHeight}px`,
        } as CSSProperties
      }
    >
      <main
        id={isMobile ? "main-content" : undefined}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
        style={{
          backgroundImage: "var(--chrome-page-bg)",
        }}
      >
        <div
          className={cn(
            "flex min-h-0 w-full flex-1 flex-col",
            padsContent && "overflow-y-auto pt-[var(--mobile-nav-h)] pb-[calc(var(--mobile-tab-h)+1rem)]"
          )}
        >
          <AccountStatusBanner className={padsContent ? undefined : "pt-[calc(var(--mobile-nav-h)+0.5rem)]"} />
          {children}
        </div>
        <MobileActionsSheet>
          <MobileNavBar />
          <MobileTabBar />
        </MobileActionsSheet>
      </main>
      <MobileProfileSheet />
    </div>
  );
}

function ShellLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const isMobile = useIsMobile();
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
    <div className="relative hidden h-screen w-full overflow-hidden bg-sidebar md:flex">
      {SHOW_DESKTOP_LEFT_SIDEBAR ? (
        <LeftSidebar
          collapsed={leftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
        />
      ) : null}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          id={isMobile ? undefined : "main-content"}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-background"
            style={{
              backgroundImage: "var(--chrome-page-bg)",
            }}
          />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
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
          </div>
        </main>
      </div>
      {hasRightSidebar ? <RightSidebar /> : null}
    </div>
  );

  const mobileLayout = (
    <MobileShellProvider>
      <MobileShellFrame pathname={pathname} isMobile={isMobile}>
        {children}
      </MobileShellFrame>
    </MobileShellProvider>
  );

  const content = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>
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
  return <ShellLayoutInner>{children}</ShellLayoutInner>;
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
