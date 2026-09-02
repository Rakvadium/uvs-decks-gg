const GUARD_MS = 500;
const EVENT_TYPES = ["pointerup", "mouseup", "touchend", "click"] as const;

type EventTargetLike = {
  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void;
};

function defaultTarget(): EventTargetLike | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function prevent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

let activeCleanup: (() => void) | null = null;

export function suppressSubsequentPointerEvents(
  durationMs = GUARD_MS,
  target: EventTargetLike | undefined = defaultTarget()
) {
  if (!target) return;

  activeCleanup?.();

  const opts: AddEventListenerOptions = { capture: true };
  for (const type of EVENT_TYPES) {
    target.addEventListener(type, prevent, opts);
  }

  const shield =
    typeof document !== "undefined" && target === document
      ? document.createElement("div")
      : null;
  if (shield) {
    shield.setAttribute("aria-hidden", "true");
    shield.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    document.body.appendChild(shield);
  }

  const timer = setTimeout(() => {
    activeCleanup?.();
  }, durationMs);

  activeCleanup = () => {
    clearTimeout(timer);
    for (const type of EVENT_TYPES) {
      target.removeEventListener(type, prevent, opts);
    }
    shield?.remove();
    activeCleanup = null;
  };
}
