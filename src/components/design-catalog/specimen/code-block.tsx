"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copy code",
  icon,
  className,
}: {
  value: string | (() => string);
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => {
        void navigator.clipboard?.writeText(typeof value === "function" ? value() : value).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="text-success" /> : (icon ?? <Copy />)}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}

/** Readable snippet: monospace comes from Tailwind preflight on `pre`/`code`, not a font class. */
export function CodeBlock({
  code,
  className,
  caption,
  wrap = false,
}: {
  code: string;
  className?: string;
  caption?: string;
  /** Soft-wrap long lines (class strings) instead of scrolling sideways. */
  wrap?: boolean;
}) {
  return (
    <figure className={cn("group/code relative min-w-0", className)}>
      {caption ? (
        <figcaption className="mb-1.5 text-xs text-muted-foreground">{caption}</figcaption>
      ) : null}
      <pre className={cn("max-h-96 overflow-auto rounded-md border border-hairline bg-muted-tint py-3 pl-4 pr-12 text-[13px] leading-6 text-foreground [tab-size:2]", wrap && "whitespace-pre-wrap break-words")}>
        <code>{code}</code>
      </pre>
      <CopyButton value={code} className="absolute right-1.5 top-1.5" />
    </figure>
  );
}

/** Inline token / class chip. Never case-transformed. */
export function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        "whitespace-nowrap rounded-md border border-hairline bg-muted-soft px-1.5 py-px text-[12px] normal-case tracking-normal text-foreground",
        className,
      )}
    >
      {children}
    </code>
  );
}
