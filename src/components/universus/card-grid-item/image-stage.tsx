"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CARD_GLOW_REST, CARD_GLOW_HOVER } from "@/components/universus/card-item/glow";
import { useCardGridItemContext } from "./context";
import { CardImageDisplay } from "./image-display";

export function CardGridItemImageStage() {
  const { displayCard, isFlipped, isHovered, isDragging, prefersReducedMotion } = useCardGridItemContext();

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl transition-shadow duration-150"
      style={{ boxShadow: isDragging ? CARD_GLOW_REST : isHovered ? CARD_GLOW_HOVER : CARD_GLOW_REST }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isFlipped ? "back" : "front"}
          initial={false}
          animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
          exit={prefersReducedMotion || isDragging ? {} : { rotateY: 90, opacity: 0 }}
          transition={{ duration: isDragging ? 0 : 0.25 }}
          className="absolute inset-0 overflow-hidden rounded-xl [backface-visibility:hidden]"
        >
          <CardImageDisplay imageUrl={displayCard.imageUrl} name={displayCard.name} />
        </motion.div>
      </AnimatePresence>

      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-150"
        style={{ opacity: !isDragging && isHovered ? 0.25 : 0 }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,transparent_40%,var(--primary)/10_50%,transparent_60%)] transition-opacity duration-150"
        style={{
          backgroundSize: "200% 200%",
          opacity: !isDragging && isHovered ? 1 : 0,
          animation:
            !isDragging && isHovered && !prefersReducedMotion ? "holo-shimmer 3s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}
