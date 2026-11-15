// Renders each user-facing empty state with react-dom/client on happy-dom, as
// tests/create-entity-dialog.test.ts does, with Convex replaced by empty query results.
import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act, createElement, type ComponentType, type ReactElement, type ReactNode } from "react";

const EMPTY_QUERIES: Record<string, unknown> = {
  "teams/permissions:getTeam": { _id: "team-1", name: "Team" },
  "teams/hub:getHubCapabilities": {},
  "teams/announcements:listPinned": [],
  "teams/events:listForHub": [],
  "user:currentUser": null,
  "textModeration:publishGate": {},
  "tierLists:listPublicFeed": [],
  "tierLists:listMine": [],
};
const functionName = (ref: unknown) => String((ref as Record<symbol, unknown>)[Symbol.for("functionName")] ?? "");
const noop = () => Promise.resolve(null);

const realConvexReact = await import("convex/react");
mock.module("convex/react", () => ({
  ...realConvexReact,
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useQuery: (ref: unknown, args?: unknown) => (args === "skip" ? undefined : EMPTY_QUERIES[functionName(ref)]),
  usePaginatedQuery: () => ({ results: [], status: "Exhausted", isLoading: false, loadMore: () => {} }),
  useMutation: () => noop,
  useAction: () => noop,
}));
const realNavigation = await import("next/navigation");
const router = { push: () => {}, replace: () => {}, back: () => {}, forward: () => {}, refresh: () => {}, prefetch: () => {} };
mock.module("next/navigation", () => ({ ...realNavigation, useRouter: () => router }));

GlobalRegistrator.register();
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { GameProvider } = await import("../src/games/game-context");
const { TeamHubPrimaryActionProvider } = await import("../src/components/teams/team-hub/primary-action-context");
const { NoCardsFound } = await import("../src/components/gallery/main-content/no-cards-found");
const { TeamHubAnnouncementsContent } = await import("../src/components/teams/team-hub/announcements-content");
const { TeamHubEventsContent } = await import("../src/components/teams/team-hub/events-content");
const { TeamHubChatContent } = await import("../src/components/teams/team-hub/chat-content");
const { CommunityTierListsSidebarPanel } = await import(
  "../src/components/community/community-right-sidebar/tier-lists-panel"
);
const { BarDistributionChart } = await import("../src/components/deck-details/deck-details-sidebar-stats/bar-chart");
const { PieDistributionChart } = await import(
  "../src/components/deck-details/deck-details-sidebar-stats/distribution-chart"
);

type Root = ReturnType<typeof createRoot>;
let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});
afterAll(() => GlobalRegistrator.unregister());

function render(element: ReactElement) {
  const Game = GameProvider as ComponentType<{ game: "uvs"; hostKind: "standalone"; children?: ReactNode }>;
  const container = document.createElement("div");
  document.body.append(container);
  act(() => {
    root = createRoot(container);
    root.render(
      createElement(Game, { game: "uvs", hostKind: "standalone" }, createElement(TeamHubPrimaryActionProvider, null, element)),
    );
  });
}

function emptyStates() {
  return [...document.querySelectorAll<HTMLElement>('[data-slot="empty-state"]')].map((node) => ({
    variant: node.dataset.variant,
    title: node.querySelector('[data-slot="empty-state-title"]')?.textContent,
  }));
}

describe("user-facing empty states render through EmptyState", () => {
  const sites: Array<[string, () => ReactElement, { variant: string; title: string }]> = [
    ["gallery search miss", () => createElement(NoCardsFound), { variant: "page", title: "No cards found" }],
    [
      "team hub News",
      () => createElement(TeamHubAnnouncementsContent, { teamId: "team-1" }),
      { variant: "inline", title: "No announcements yet." },
    ],
    [
      "team hub Calendar",
      () => createElement(TeamHubEventsContent, { teamId: "team-1" }),
      { variant: "inline", title: "No events scheduled." },
    ],
    [
      "team hub Chat",
      () => createElement(TeamHubChatContent, { teamId: "team-1" }),
      { variant: "inline", title: "No messages yet." },
    ],
    [
      "deck stats bar chart",
      () => createElement(BarDistributionChart, { title: "Cost", buckets: [], total: 0 }),
      { variant: "inline", title: "No data." },
    ],
    [
      "deck stats pie chart",
      () => createElement(PieDistributionChart, { title: "Types", buckets: [], total: 0 }),
      { variant: "inline", title: "No data." },
    ],
    [
      "community sidebar public tier lists",
      () => createElement(CommunityTierListsSidebarPanel),
      { variant: "inline", title: "No public tier lists yet." },
    ],
  ];

  for (const [name, element, expected] of sites) {
    test(name, () => {
      render(element());
      expect(emptyStates()).toEqual([expected]);
    });
  }

  test("community sidebar My lists", () => {
    render(createElement(CommunityTierListsSidebarPanel));
    const mine = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find((tab) => tab.textContent === "My lists");
    act(() => mine?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
    expect(emptyStates()).toEqual([{ variant: "inline", title: "You have no tier lists yet." }]);
  });
});
