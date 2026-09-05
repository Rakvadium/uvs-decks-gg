"use client";

import { useEffect, useState } from "react";

type Snapshot = Record<string, string | number>;

function readSnapshot(): Snapshot {
  const vv = window.visualViewport;
  const frame = document.querySelector<HTMLElement>("[data-mobile-shell-frame]");
  const header = document.querySelector<HTMLElement>("[data-mobile-shell-frame] header");
  const bar = document.querySelector<HTMLElement>("[data-mobile-shell-frame] [data-mobile-tab-bar]");
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);
  const fr = rect(frame);
  const hr = rect(header);
  const br = rect(bar);
  const active = document.activeElement;
  return {
    innerH: window.innerHeight,
    innerW: window.innerWidth,
    docH: document.documentElement.clientHeight,
    scrollY: Math.round(window.scrollY),
    vvH: vv ? Math.round(vv.height) : -1,
    vvW: vv ? Math.round(vv.width) : -1,
    vvTop: vv ? Math.round(vv.offsetTop) : -1,
    vvPageTop: vv ? Math.round(vv.pageTop) : -1,
    vvScale: vv ? Number(vv.scale.toFixed(3)) : -1,
    frameTop: fr ? Math.round(fr.top) : -1,
    frameH: fr ? Math.round(fr.height) : -1,
    frameStyle: frame ? `${frame.style.top}/${frame.style.height}` : "-",
    headerTop: hr ? Math.round(hr.top) : -1,
    barBottom: br ? Math.round(br.bottom) : -1,
    focus: active ? `${active.tagName}${active instanceof HTMLInputElement ? `:${active.type}` : ""}` : "-",
    ua: navigator.userAgent.replace(/Mozilla\/5\.0 \([^)]*\)\s*/, "").slice(0, 60),
  };
}

function readEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("vvdebug");
}

export function MobileViewportDebug() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!readEnabled()) return;
    const interval = window.setInterval(() => setSnapshot(readSnapshot()), 250);
    return () => window.clearInterval(interval);
  }, []);

  if (!snapshot) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-2 top-1/2 z-[999] -translate-y-1/2 rounded-md bg-black/85 p-2 font-mono text-[11px] leading-tight text-lime-300"
    >
      {Object.entries(snapshot).map(([key, value]) => (
        <div key={key}>
          {key}: {String(value)}
        </div>
      ))}
    </div>
  );
}
