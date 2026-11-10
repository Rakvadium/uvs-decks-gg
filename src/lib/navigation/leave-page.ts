/**
 * "Leave site?" prompts for intentional navigations. Two library handlers can prompt:
 * - Convex's `unsavedChangesWarning` (any mutation/action in flight, including background ones
 *   like `sessions:ensureAppearanceMigrated` that start right after sign-in) — disabled on the
 *   client and replaced by the check below;
 * - `@convex-dev/auth`'s provider while a token refresh is running (not configurable).
 * Our listener is registered first, in the capture phase, and swallows the event for auth
 * redirects started via `leavePage` and for any unload from an auth-flow page (`/auth/*`,
 * `/sign-in`, `/sign-up`), so no later listener can prompt.
 */
import { isAuthFlowPath } from "@shared/auth-handoff";

type ConnectionStateSource = { connectionState(): { hasInflightRequests: boolean } };

let intentionalUnload = false;
let installed = false;

/** Navigate away (full document load) without an unsaved-changes prompt. */
export function leavePage(url: string, options: { replace?: boolean } = {}): void {
  intentionalUnload = true;
  if (options.replace) {
    window.location.replace(url);
  } else {
    window.location.assign(url);
  }
}

/** Prompt before unload only while Convex writes are pending on a regular page. */
export function installUnsavedChangesWarning(client: ConnectionStateSource): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("pageshow", () => {
    // Back/forward cache restore: the earlier intentional navigation is over.
    intentionalUnload = false;
  });
  window.addEventListener(
    "beforeunload",
    (event) => {
      if (intentionalUnload || isAuthFlowPath(window.location.pathname)) {
        event.stopImmediatePropagation();
        return;
      }
      if (!client.connectionState().hasInflightRequests) return;
      event.preventDefault();
      event.returnValue = "";
    },
    { capture: true },
  );
}
