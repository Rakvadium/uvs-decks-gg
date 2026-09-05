"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, Layers, Search, Users, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_BOTTOM } from "../mobile-glass";
import { useMobileShell } from "../mobile-shell-context";
import { useMobileActionsSheetContext } from "../mobile-actions-sheet/context";
import type { SlotRegistration } from "../shell-slot-provider";
import { MOBILE_ACT_BUTTON_CLASS, MobileActButton } from "./act-button";
import { MOBILE_ROUND_BUTTON, MobileGlassCapsule } from "./glass-capsule";
import {
  MOBILE_PEEK_PLACEMENT,
  MOBILE_PEEK_SIDE,
  MOBILE_TAB_ACT_SIZE_CLASS,
  MOBILE_TAB_ICON_CLASS,
  MOBILE_TAB_ITEM_WIDTH_CLASS,
  MOBILE_TAB_METRIC_VARS,
  MOBILE_TAB_ROW_HEIGHT_CLASS,
  MOBILE_TAB_ROW_SQUARE_CLASS,
} from "./metrics";
import { resolveMobileBottomTools, type MobileBottomTools, type MobileSearchState } from "./page-tools";
import { MobileProfileTab } from "./profile-tab";
import { useKeyboardInset } from "./use-keyboard-inset";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: "gallery", label: "Cards", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "community", label: "Community", icon: Users },
];

const NO_SEARCH: MobileSearchState = { available: false, active: false };

const expandEase = "cubic-bezier(0.32, 0.72, 0, 1)";

const tabItemClassName = cn(
  "group relative flex min-w-0 shrink-0 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  MOBILE_TAB_ITEM_WIDTH_CLASS
);

const iconSwapClassName =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200";

const capsuleBodyClassName = cn(MOBILE_TAB_ROW_HEIGHT_CLASS, "items-stretch gap-0.5 p-0.5");

interface PeekTriggerProps {
  slot: SlotRegistration;
  isOpen: boolean;
  onOpen: () => void;
  variant?: "circle" | "tab" | "act";
}

function PeekTrigger({ slot, isOpen, onOpen, variant = "circle" }: PeekTriggerProps) {
  const Icon = slot.icon;
  const label = slot.label ?? "Page details";
  const isMedia = slot.iconFit === "media";
  const isTab = variant === "tab";
  const isAct = variant === "act";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      data-mobile-peek
      className={cn(
        isTab && cn(tabItemClassName, "text-muted-foreground hover:text-foreground"),
        isAct && cn(MOBILE_ACT_BUTTON_CLASS, MOBILE_TAB_ACT_SIZE_CLASS),
        !isTab && !isAct && MOBILE_ROUND_BUTTON,
        !isTab && isMedia && "overflow-hidden p-0",
        isOpen && !isMedia && "bg-primary/20 text-primary",
        isOpen && isMedia && !isTab && "ring-2 ring-primary/60"
      )}
    >
      {Icon ? (
        <span
          key={slot.id}
          className={cn(
            "flex items-center justify-center",
            isMedia && "overflow-hidden rounded-full",
            isMedia
              ? isTab
                ? cn("size-7 border border-border/50 shadow-[var(--chrome-shell-avatar-ring)]", isOpen && "ring-2 ring-primary/60")
                : "size-full"
              : MOBILE_TAB_ICON_CLASS,
            isTab && "motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90",
            iconSwapClassName
          )}
        >
          <Icon className="size-full" />
        </span>
      ) : (
        <span className="text-sm font-semibold">{label.slice(0, 1)}</span>
      )}
    </button>
  );
}

function PrimaryTabs({ pathname, peek }: { pathname: string; peek?: ReactNode }) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.includes(`/${item.path}`);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={`/${item.path}`}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              tabItemClassName,
              isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                MOBILE_TAB_ICON_CLASS,
                "shrink-0 motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90",
                isActive && "[filter:var(--chrome-shell-icon-drop-shadow)]"
              )}
              strokeWidth={isActive ? 2.25 : 2}
            />
          </Link>
        );
      })}
      <MobileProfileTab className={tabItemClassName} />
      {peek ? (
        <>
          <ActCapsuleDivider className="mx-0.5" />
          {peek}
        </>
      ) : null}
    </>
  );
}

function ActCapsuleDivider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("w-px shrink-0 self-center bg-border/50 [height:calc(var(--mobile-tab-icon)+4px)]", className)}
    />
  );
}

function MobileTabBarBody({ tools }: { tools: MobileBottomTools }) {
  const pathname = usePathname().split("?")[0] ?? "";
  const { setTabBarHeight, isActionsSheetOpen } = useMobileShell();
  const { sidebarSlots, defaultSlot, openSheet } = useMobileActionsSheetContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);

  const searchState = tools.useSearchState?.() ?? NO_SEARCH;
  const hasPageActions = tools.useActionsState?.() ?? Boolean(tools.Actions);
  const SearchComponent = tools.Search;
  const ActionsComponent = tools.Actions;

  const hasSearch = Boolean(SearchComponent) && searchState.available;
  const hasActions = hasPageActions && Boolean(ActionsComponent);
  const hasPeek = sidebarSlots.length > 0 && Boolean(defaultSlot);
  const peekInAct = hasPeek && MOBILE_PEEK_PLACEMENT === "act";
  const hasActCapsule = hasSearch || hasActions || peekInAct;
  const searchOpen = isSearchOpen && hasSearch;
  const keyboardInset = useKeyboardInset(searchOpen);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => setTabBarHeight(element.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [setTabBarHeight]);

  useEffect(() => {
    if (!hasSearch) setSearchOpen(false);
  }, [hasSearch]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const input = root.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) return;
    if (searchOpen) {
      input.focus();
      return;
    }
    input.blur();
  }, [searchOpen]);

  const closeSearch = () => setSearchOpen(false);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-40 flex flex-col gap-[var(--mobile-tab-row-gap)] px-3 pt-3",
        keyboardInset > 0 ? "pb-2" : MOBILE_SAFE_BOTTOM,
        "motion-safe:transition-[transform,opacity] motion-safe:duration-200",
        isActionsSheetOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
      style={{ ...MOBILE_TAB_METRIC_VARS, bottom: keyboardInset } as CSSProperties}
      aria-hidden={isActionsSheetOpen || undefined}
    >
      {hasPeek && defaultSlot && MOBILE_PEEK_PLACEMENT === "row" ? (
        <div
          className={cn(
            "flex",
            MOBILE_PEEK_SIDE === "end" ? "justify-end" : "justify-start",
            searchOpen && "pointer-events-none invisible"
          )}
          aria-hidden={searchOpen || undefined}
        >
          <MobileGlassCapsule className="pointer-events-auto" bodyClassName={MOBILE_TAB_ROW_SQUARE_CLASS}>
            <PeekTrigger slot={defaultSlot} isOpen={isActionsSheetOpen} onOpen={() => openSheet()} />
          </MobileGlassCapsule>
        </div>
      ) : null}

      <div className="flex items-center gap-[var(--mobile-tab-row-gap)]">
        <div className="relative min-w-0 flex-1">
          <nav
            className={cn(
              "pointer-events-auto w-fit",
              isActionsSheetOpen && "pointer-events-none",
              searchOpen && "pointer-events-none invisible"
            )}
            aria-label="Primary"
            aria-hidden={searchOpen || undefined}
          >
            <MobileGlassCapsule bodyClassName={capsuleBodyClassName}>
              <PrimaryTabs
                pathname={pathname}
                peek={
                  hasPeek && defaultSlot && MOBILE_PEEK_PLACEMENT === "tabs" ? (
                    <PeekTrigger
                      slot={defaultSlot}
                      isOpen={isActionsSheetOpen}
                      onOpen={() => openSheet()}
                      variant="tab"
                    />
                  ) : null
                }
              />
            </MobileGlassCapsule>
          </nav>

          <div
            className={cn(
              "absolute inset-y-0 right-0 min-w-0 overflow-hidden motion-safe:transition-[width] motion-safe:duration-300",
              !searchOpen && "pointer-events-none"
            )}
            style={{
              width: searchOpen ? "100%" : 0,
              transitionTimingFunction: expandEase,
            }}
            aria-hidden={!searchOpen || undefined}
          >
            {SearchComponent ? (
              <div
                role="search"
                className={cn("pointer-events-auto h-full", isActionsSheetOpen && "pointer-events-none")}
                onKeyDown={handleSearchKeyDown}
              >
                <MobileGlassCapsule bodyClassName={cn(MOBILE_TAB_ROW_HEIGHT_CLASS, "px-0.5")}>
                  <SearchComponent autoFocus={searchOpen} />
                </MobileGlassCapsule>
              </div>
            ) : null}
          </div>
        </div>

        {hasActCapsule ? (
          <div className="pointer-events-auto shrink-0" aria-label="Page actions" role="group">
            <MobileGlassCapsule bodyClassName={cn(MOBILE_TAB_ROW_HEIGHT_CLASS, "items-center gap-0.5 p-0.5")}>
              {searchOpen ? (
                <MobileActButton key="close" label="Close search" onClick={closeSearch} className={iconSwapClassName}>
                  <X className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.25} />
                </MobileActButton>
              ) : (
                <>
                  {hasSearch ? (
                    <MobileActButton
                      key="search"
                      label={searchState.active ? "Edit search" : "Search"}
                      active={searchState.active}
                      onClick={() => setSearchOpen(true)}
                      className={iconSwapClassName}
                    >
                      <Search className={MOBILE_TAB_ICON_CLASS} strokeWidth={searchState.active ? 2.5 : 2.25} />
                      {searchState.active ? (
                        <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" aria-hidden />
                      ) : null}
                    </MobileActButton>
                  ) : null}
                  {hasActions && ActionsComponent ? <ActionsComponent /> : null}
                  {peekInAct && defaultSlot ? (
                    <>
                      {hasSearch || hasActions ? <ActCapsuleDivider /> : null}
                      <PeekTrigger
                        slot={defaultSlot}
                        isOpen={isActionsSheetOpen}
                        onOpen={() => openSheet()}
                        variant="act"
                      />
                    </>
                  ) : null}
                </>
              )}
            </MobileGlassCapsule>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MobileTabBar() {
  const rawPathname = usePathname();
  const pathname = rawPathname.split("?")[0] ?? "";
  const tools = resolveMobileBottomTools(pathname);

  return <MobileTabBarBody key={tools.id} tools={tools} />;
}
