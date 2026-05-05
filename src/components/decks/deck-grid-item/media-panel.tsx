import Image from "next/image";
import { Eye, Globe, Hexagon, Layers, Link2, Lock, Pencil, Trophy, UserPlus } from "lucide-react";
import { deckTeamSharingFromDeck, normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useDeckGridItemContext } from "./context";

export function DeckGridItemMediaPanel() {
  const {
    deck,
    displayImage,
    coverImagePriority,
  } = useDeckGridItemContext();
  const { name, userId } = deck;
  const { display, viewerUserId } = useProfanityDisplayText();
  const isOwnDeck = viewerUserId != null && userId === viewerUserId;
  const showName = display(name, isOwnDeck);
  const visibility = normalizeDeckVisibility(deck);

  return (
    <div className="relative w-[120px] shrink-0 overflow-hidden bg-card">
      {displayImage ? (
        <>
          <Image
            src={displayImage}
            alt={showName}
            fill
            sizes="120px"
            className="object-cover object-top transition-all duration-150 group-hover:scale-105"
            priority={coverImagePriority}
            loading={coverImagePriority ? undefined : "lazy"}
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
        {visibility === "private" ? (
          <div className="rounded border border-border/50 bg-muted/60 p-1.5 backdrop-blur-sm">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : visibility === "share" ? (
          <div className="rounded border border-border/50 bg-muted/60 p-1.5 backdrop-blur-sm">
            <UserPlus className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : visibility === "unlisted" ? (
          <div className="rounded border border-border/50 bg-muted/60 p-1.5 backdrop-blur-sm">
            <Link2 className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : visibility === "team" ? (
          <div className="rounded border border-border/50 bg-muted/60 p-1.5 backdrop-blur-sm">
            {deckTeamSharingFromDeck(deck) === "team_editable" ? (
              <Pencil className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Eye className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ) : visibility === "tournament" ? (
          <div className="rounded border border-primary/40 bg-primary/30 p-1.5 backdrop-blur-sm">
            <Trophy className="h-3 w-3 text-primary" />
          </div>
        ) : (
          <div className="rounded border border-primary/40 bg-primary/30 p-1.5 backdrop-blur-sm">
            <Globe className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
