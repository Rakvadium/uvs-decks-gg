# Handoff: PERF-009 (stable mobile breakpoint)

## Shipped

- **`useIsMobile`:** Replaced `useState(false)` + `useEffect` that only applied `matchMedia` after mount with **`useSyncExternalStore`**, **`getSnapshot`** reading **`window.matchMedia(\`(max-width: 767px)\`)`** (aligned with Tailwind **`md`** at 768px), and **`subscribe`** on the query’s **`change`** event (with **`addListener` / `removeListener`** fallback for older engines).

## Verify manually

- Gallery on a narrow viewport: grid density and any infinite-scroll **`rootMargin`** behavior should match the mobile breakpoint on first paint, without a visible layout swap shortly after load.
- Resize across 768px: dependent UI should update when the media query fires.

## Follow-ups (optional)

- **PERF-015** — Revisit **`useInfiniteSlice`** / **`IntersectionObserver`** recreation and **`rootMargin`** now that **`useIsMobile`** is stable.
