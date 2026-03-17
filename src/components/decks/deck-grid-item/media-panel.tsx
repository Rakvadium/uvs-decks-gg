import Image from "next/image";
import { Globe, Hexagon, Layers, Lock } from "lucide-react";
import { useDeckGridItemContext } from "./context";

export function DeckGridItemMediaPanel() {
  const {
    deck: { isPublic, name },
    displayImage,
  } = useDeckGridItemContext();

  return (
    <div className="relative w-[120px] shrink-0 overflow-hidden bg-card">
      {displayImage ? (
        <>
          <Image
            src={displayImage}
            alt={name}
            fill
            className="object-cover object-top transition-all duration-150 group-hover:scale-105"
          />
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
          <div className="rounded border border-primary/40 bg-primary/30 p-1.5 backdrop-blur-sm">
            <Globe className="h-3 w-3 text-primary" />
          </div>
        ) : (
          <div className="rounded border border-border/50 bg-muted/60 p-1.5 backdrop-blur-sm">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
