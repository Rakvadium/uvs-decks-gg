import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { useGallerySidebarContext } from "./context";

export function DeckDetailsGallerySidebarHoverPreview() {
  const { hoveredListCard, isMobile, shellSidebarWidth, viewMode } = useGallerySidebarContext();

  if (isMobile || viewMode !== "list" || !hoveredListCard || typeof document === "undefined") return null;

  const topOffset = 56;
  const iconRailWidth = 48;
  const gap = 12;
  const targetWidth = 260;
  const targetHeight = Math.round(targetWidth * 1.4);
  const maxHeight = Math.max(220, window.innerHeight - topOffset - 12);
  const previewHeight = Math.min(targetHeight, maxHeight);
  const previewWidth = Math.round(previewHeight / 1.4);
  const right = shellSidebarWidth + iconRailWidth + gap;

  return createPortal(
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-none fixed z-[80]"
      style={{
        right,
        top: topOffset,
        width: previewWidth,
        height: previewHeight,
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-primary/40 bg-background/90 shadow-[0_0_0_1px_var(--primary)/30,0_0_6px_var(--primary)/70,0_0_14px_var(--primary)/20]">
        {hoveredListCard.imageUrl ? (
          <Image src={hoveredListCard.imageUrl} alt={hoveredListCard.name} fill className="object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {hoveredListCard.name}
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
