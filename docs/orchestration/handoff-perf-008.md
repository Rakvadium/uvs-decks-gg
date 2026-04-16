# Handoff: PERF-008 (batched UI state persistence)

## Shipped

- **`UIStateProvider`:** Replaced the `useEffect([uiState])` synchronous `persistUIState` with a **~120ms debounce** followed by **`requestIdleCallback`** ( **`setTimeout(0)`** when idle callbacks are unavailable). Pending work is cancelled before scheduling the next flush so bursts coalesce.
- **Reliability:** **`visibilitychange`** when `document.visibilityState === "hidden"`, **`pagehide`**, **`beforeunload`**, and **provider unmount** cancel pending timers/idle handles and **flush** the latest `uiState` from a ref so data is not lost on tab switch, close, or layout unmount.

## Verify manually

- Gallery: rapid typing in search, toggling filters, scrolling — DevTools Performance should show far fewer `localStorage.setItem` calls than before during the burst.
- Change a preference, switch tabs or close the tab, reopen: persisted gallery filters / view mode / sort should still match.

## Follow-ups (optional)

- The Convex auth sync paths still touch `activeDeckId` in `localStorage` directly for server reconciliation; that is unchanged and intentional for immediate server alignment.
