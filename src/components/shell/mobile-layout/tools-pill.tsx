"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileActButton } from "../mobile-tab-bar/act-button";
import { MobileGlassCapsule } from "../mobile-tab-bar/glass-capsule";
import { GlassRing, LIQUID_GLASS } from "./liquid-glass";
import { MOBILE_TAB_METRIC_VARS } from "../mobile-tab-bar/metrics";
import { cornerRadius, morphTransition, useChromeKey, usePresence } from "./morph";
import { kickerVariants, sectionHeadingVariants } from "@/components/ui/typography-headings";

export interface MobileToolsTrigger {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
}

interface MobileToolsPillProps {
  triggers: MobileToolsTrigger[];
  /** Panel content. `focus` is the trigger that opened it (e.g. "search" to focus the field). */
  children: (args: { focus: string; close: () => void }) => ReactNode;
  label: string;
}


/**
 * The top-right pill for searching, filtering and sorting what's on screen. Tapping it grows the
 * pill down and to the left into a large panel; the panel is laid out full size and revealed with
 * an animated clip so its contents never scale.
 */
export function MobileToolsPill({ triggers, children, label }: MobileToolsPillProps) {
  const [focus, setFocus] = useState<string | null>(null);
  // The trigger that opened the panel; kept through the closing animation.
  const [lastFocus, setLastFocus] = useState("");
  // The pill's box and corner radii, read from the DOM so the clip matches the chrome's shapes.
  const [pill, setPill] = useState({ width: 0, height: 48, radius: 24, panelRadius: 24 });
  const panelRef = useRef<HTMLDivElement | null>(null);
  const chromeKey = useChromeKey();
  const pillRef = useRef<HTMLDivElement | null>(null);
  const open = focus !== null;
  const present = usePresence(open);

  useLayoutEffect(() => {
    const element = pillRef.current;
    if (!element) return;
    const update = () => {
      const capsule = element.firstElementChild;
      setPill({
        width: element.offsetWidth,
        height: element.offsetHeight,
        radius: cornerRadius(capsule, element.offsetHeight / 2),
        panelRadius: cornerRadius(panelRef.current, 24),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [chromeKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setFocus(null);
  const clip = open
    ? `inset(0 0 0 0 round ${pill.panelRadius}px)`
    : `inset(0 0 calc(100% - ${pill.height}px) calc(100% - ${pill.width}px) round ${pill.radius}px)`;

  return (
    <div className="pointer-events-none absolute inset-0" style={MOBILE_TAB_METRIC_VARS}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={open ? 0 : -1}
        onClick={close}
        className={cn(
          "absolute inset-0 bg-background-soft backdrop-blur-sm transition-opacity",
          open ? "duration-300" : "duration-200",
          open ? "pointer-events-auto opacity-100" : "opacity-0"
        )}
      />

      <div ref={pillRef} className="absolute right-3 top-[calc(var(--mobile-nav-h)+0.5rem)]">
        <MobileGlassCapsule className="pointer-events-auto" bodyClassName={cn("h-12 items-center gap-0.5 p-0.5", LIQUID_GLASS)}>
          {triggers.map((trigger) => (
            <MobileActButton
              key={trigger.id}
              label={trigger.label}
              active={trigger.active}
              badge={trigger.badge}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => {
                setLastFocus(trigger.id);
                setFocus(trigger.id);
              }}
              className="touch-manipulation select-none [-webkit-touch-callout:none]"
            >
              {trigger.icon}
            </MobileActButton>
          ))}
        </MobileGlassCapsule>
      </div>

      <div
        aria-hidden={!open || undefined}
        className={cn(
          "absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[calc(var(--mobile-nav-h)+0.5rem)]"
        )}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className={cn("absolute inset-0 flex flex-col overflow-hidden rounded-3xl text-foreground [-webkit-touch-callout:none]", LIQUID_GLASS, open && "pointer-events-auto")}
          style={{ clipPath: clip, WebkitClipPath: clip, opacity: open ? 1 : 0, transition: morphTransition(open) }}
        >
          <GlassRing />
          {present ? (
            <div
              className="flex min-h-0 flex-1 flex-col"
              style={{ opacity: open ? 1 : 0, transition: `opacity ${open ? "220ms ease-out 120ms" : "120ms ease-in"}` }}
            >
              {children({ focus: focus ?? lastFocus, close })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Header row for a tools panel: title on the left, Done on the right. */
export function MobileToolsPanelHeader({ title, detail, onDone }: { title: string; detail?: ReactNode; onDone: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline pl-4 pr-2">
      <div className="min-w-0 flex-1 leading-tight">
        <h2 className={cn(sectionHeadingVariants({ size: "sm" }), "truncate text-foreground")}>{title}</h2>
        {detail ? <div className="truncate text-xs tabular-nums text-muted-foreground">{detail}</div> : null}
      </div>
      <button
        type="button"
        onClick={onDone}
        className="flex h-9 shrink-0 items-center rounded-pill px-3 text-sm font-semibold text-primary hover:bg-primary-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Done
      </button>
    </div>
  );
}

export function MobileToolsSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className={cn(kickerVariants({ size: "sm" }), "block px-4 pb-1.5 pt-4")}>
      {children}
    </div>
  );
}

/** A single-choice option list (sort order, format, view). */
export function MobileToolsOptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="mx-3 overflow-hidden rounded-xl border border-hairline bg-card-elevated [&>*+*]:border-t [&>*+*]:border-hairline">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:bg-muted-elevated"
          >
            <span className="min-w-0 flex-1">{option.label}</span>
            {selected ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
