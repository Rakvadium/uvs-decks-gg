import { CardFlipButton } from "@/components/card/flip-button";
import { useCardGridItemContext } from "./context";

export function CardFlipControl() {
  const { isHovered, isFlipped, hasBackCardId, hasBackCardData, prefersReducedMotion, handleFlip } =
    useCardGridItemContext();

  if (!hasBackCardId) return null;

  return (
    <CardFlipButton
      isFlipped={isFlipped}
      isHovered={isHovered}
      disabled={!hasBackCardData}
      prefersReducedMotion={prefersReducedMotion}
      onFlip={handleFlip}
    />
  );
}
