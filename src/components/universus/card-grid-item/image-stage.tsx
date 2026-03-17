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
        "shadow-[0_0_0_1px_var(--primary)/30,0_0_5px_var(--primary)/50]",
        isHovered && "shadow-[0_0_0_1px_var(--primary)/70,0_0_8px_var(--primary)/90,0_0_16px_var(--primary)/25]"
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isFlipped ? "back" : "front"}
          initial={false}
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
          "pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-150",
          isHovered ? "opacity-25" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg",
          "bg-[linear-gradient(135deg,transparent_40%,var(--primary)/10_50%,transparent_60%)]",
          "transition-opacity duration-150",
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
