/**
 * The (app) layout mounts every page twice, in the desktop frame and in the mobile frame, and
 * hides the inactive frame with CSS. A portaled dialog escapes that CSS, and the edit dialog's
 * open state lives in DeckDetailsProvider above both copies, so only the copy in the frame that
 * matches the viewport may render it. Two open modals also aria-hide each other.
 */
export function isActiveShellCopy(inMobileShell: boolean, isMobileViewport: boolean): boolean {
  return inMobileShell === isMobileViewport;
}
