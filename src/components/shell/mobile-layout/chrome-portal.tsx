"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Shell chrome that page code fills. A portal keeps the page's React context, so controls that
 * read page-scoped providers (deck view and sort) can render in the shell.
 */
export type MobileChromeTarget = "header-tools";

interface MobileChromePortalValue {
  targets: Partial<Record<MobileChromeTarget, HTMLElement | null>>;
  setTarget: (name: MobileChromeTarget, element: HTMLElement | null) => void;
}

const MobileChromePortalContext = createContext<MobileChromePortalValue | null>(null);

export function MobileChromePortalProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<MobileChromePortalValue["targets"]>({});

  // Stable, so the ref callbacks built from it don't change identity when a target registers.
  const setTarget = useCallback<MobileChromePortalValue["setTarget"]>(
    (name, element) =>
      setTargets((current) => (current[name] === element ? current : { ...current, [name]: element })),
    []
  );
  const value = useMemo((): MobileChromePortalValue => ({ targets, setTarget }), [targets, setTarget]);

  return <MobileChromePortalContext.Provider value={value}>{children}</MobileChromePortalContext.Provider>;
}

/** Ref callback for the shell element that hosts a target. */
export function useMobileChromeTargetRef(name: MobileChromeTarget) {
  const context = useContext(MobileChromePortalContext);
  const setTarget = context?.setTarget;
  return useMemo(() => (element: HTMLElement | null) => setTarget?.(name, element), [name, setTarget]);
}

export function MobileChromePortal({ target, children }: { target: MobileChromeTarget; children: ReactNode }) {
  const element = useContext(MobileChromePortalContext)?.targets[target];
  if (!element) return null;
  return createPortal(children, element);
}
