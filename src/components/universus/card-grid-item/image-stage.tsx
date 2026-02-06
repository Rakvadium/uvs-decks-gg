"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCardGridItemContext } from "./context";
import { CardImageDisplay } from "./image-display";

export function CardGridItemImageStage() {
  const { displayCard, isFlipped, isHovered, prefersReducedMotion } = useCardGridItemContext();

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-lg",
        "shadow-[0_0_6px_-2px_var(--primary)/20]",
        isHovered && "shadow-[0_0_15px_-3px_var(--primary)/60]"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFlipped ? "back" : "front"}
          initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
          animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
          exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
        >
          <CardImageDisplay imageUrl={displayCard.imageUrl} name={displayCard.name} />
        </motion.div>
      </AnimatePresence>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-300",
          isHovered ? "opacity-25" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg",
          "bg-[linear-gradient(135deg,transparent_40%,var(--primary)/10_50%,transparent_60%)]",
          "transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundSize: "200% 200%",
          animation: isHovered && !prefersReducedMotion ? "holo-shimmer 3s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}
