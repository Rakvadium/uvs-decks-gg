"use client";

import Image from "next/image";
import * as m from "framer-motion/m";
import { createPortal } from "react-dom";
import { Hexagon } from "lucide-react";
import type { CachedCard } from "@/lib/universus/card-store";

interface CardHoverPreviewPortalProps {
  card: CachedCard | null;
  rect: DOMRect | null;
  prefersReducedMotion: boolean;
  width?: number;
  ratio?: number;
  gap?: number;
  zIndexClassName?: string;
}

export function CardHoverPreviewPortal({
  card,
  rect,
  prefersReducedMotion,
  width = 240,
  ratio = 1.4,
  gap = 16,
  zIndexClassName = "z-[60]",
}: CardHoverPreviewPortalProps) {
  if (!card || !rect) return null;
  if (typeof document === "undefined") return null;

  const previewWidth = width;
  const previewHeight = Math.round(previewWidth * ratio);
  const left = Math.max(12, rect.left - previewWidth - gap);
  const top = Math.min(
    window.innerHeight - previewHeight - 12,
    Math.max(12, rect.top + rect.height / 2 - previewHeight / 2)
  );

  return createPortal(
    <m.div
      initial={false}
      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      className={`pointer-events-none fixed ${zIndexClassName}`}
      style={{ left, top, width: previewWidth, height: previewHeight }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-primary/30 bg-background/80 shadow-[0_0_30px_-10px_var(--primary)]">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            sizes={`${previewWidth}px`}
            className="object-cover object-top"
            loading="lazy"
            fetchPriority="low"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Hexagon className="mr-2 h-4 w-4 text-muted-foreground/60" />
            {card.name}
          </div>
        )}
      </div>
    </m.div>,
    document.body
  );
}
