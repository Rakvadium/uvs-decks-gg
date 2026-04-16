# Handoff: PERF-010 (Auth guard timing)

## Shipped

- **`AuthGuard`:** Dropped **`showContent`** and the mount-only **`setTimeout(..., 1000)`** that always flipped content visible after one second (which could show children while auth was still loading or add an unnecessary delay).
- **Loading UX:** Renders **`AuthLoadingSkeleton`** when **`useConvexAuth().isLoading`** is true. When **`requireAuth`** is true and the user is signed out (after loading completes), keeps the skeleton while **`router.replace("/sign-in")`** runs so protected chrome does not flash.

## Verify manually

- Cold load signed in: skeleton should disappear as soon as Convex auth reports ready, with no fixed 1s wait.
- Signed out on routes that use **`requireAuth`** (if added later): redirect without a flash of protected layout.

## Follow-ups (optional)

- None required for current **`(app)/layout`** usage (**`requireAuth`** defaults false).
