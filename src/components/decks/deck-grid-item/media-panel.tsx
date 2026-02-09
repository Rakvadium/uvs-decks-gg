import Image from "next/image";
import { Globe, Hexagon, Layers, Lock } from "lucide-react";
import { useDeckGridItemContext } from "./context";

export function DeckGridItemMediaPanel() {
  const {
    deck: { isPublic, name },
    displayImage,
  } = useDeckGridItemContext();

  return (
    <div className="relative w-[96px] shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 via-card to-secondary/10 sm:w-[120px]">
      {displayImage ? (
        <>
          <Image
            src={displayImage}
            alt={name}
            fill
            className="object-cover object-top opacity-80 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Hexagon className="h-12 w-12 text-primary/20 transition-colors group-hover:text-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary/40" />
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2">
        {isPublic ? (
          <div className="rounded border border-primary/40 bg-primary/30 p-1 backdrop-blur-sm sm:p-1.5">
            <Globe className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />
          </div>
        ) : (
          <div className="rounded border border-border/50 bg-muted/60 p-1 backdrop-blur-sm sm:p-1.5">
            <Lock className="h-2.5 w-2.5 text-muted-foreground sm:h-3 sm:w-3" />
          </div>
        )}
      </div>
    </div>
  );
}
