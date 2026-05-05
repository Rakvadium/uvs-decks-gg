"use client";

import { ChevronDown, Eye, Globe, Link2, Lock, Pencil, Trophy, UserPlus } from "lucide-react";
import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  type DeckTeamSharing,
  type DeckVisibility,
  deckTeamSharingFromDeck,
  deckTeamSharingLabel,
  deckVisibilityLabel,
  normalizeDeckVisibility,
} from "@/lib/deck/visibility";
import type { Doc } from "../../../convex/_generated/dataModel";

const OPTIONS: Array<{
  value: DeckVisibility;
  label: string;
  hint: string;
  Icon: LucideIcon;
}> = [
  {
    value: "private",
    label: "Private",
    hint: "Only you can open this deck.",
    Icon: Lock,
  },
  {
    value: "share",
    label: "Share",
    hint: "Invite specific accounts; only they and you can view.",
    Icon: UserPlus,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    hint: "Anyone with the link can view; hidden from public lists.",
    Icon: Link2,
  },
  {
    value: "public",
    label: "Public",
    hint: "Anyone can view; listed under Public decks.",
    Icon: Globe,
  },
  {
    value: "tournament",
    label: "Tournament",
    hint: "Anyone can view; listed under Tournament and Public.",
    Icon: Trophy,
  },
];

const TEAM_SHARING_OPTIONS: Array<{
  mode: DeckTeamSharing;
  label: string;
  hint: string;
  Icon: LucideIcon;
}> = [
  {
    mode: "team_viewable",
    label: "Team view",
    hint: "Team members with deck access can view; only you edit.",
    Icon: Eye,
  },
  {
    mode: "team_editable",
    label: "Team edit",
    hint: "Team members who can create team decks can edit together.",
    Icon: Pencil,
  },
];

function visibilityBadgeVariant(visibility: DeckVisibility): "default" | "outline" {
  if (visibility === "public" || visibility === "tournament") return "default";
  return "outline";
}

function badgeIconForDisplay(
  visibility: DeckVisibility,
  teamSharing: DeckTeamSharing,
): LucideIcon {
  if (visibility === "team") {
    return teamSharing === "team_editable" ? Pencil : Eye;
  }
  const opt = OPTIONS.find((o) => o.value === visibility);
  return opt?.Icon ?? Lock;
}

interface DeckVisibilityBadgeMenuProps {
  deck: Doc<"decks">;
  isOwner: boolean;
  isEditing: boolean;
  editVisibility: DeckVisibility;
  editTeamCollaboration: DeckTeamSharing;
  onSelect: (value: DeckVisibility) => void;
  onSelectTeamSharing?: (mode: DeckTeamSharing) => void;
  compact?: boolean;
  canSetTournamentVisibility?: boolean;
  canSetTeamVisibility?: boolean;
}

export function DeckVisibilityBadgeMenu({
  deck,
  isOwner,
  isEditing,
  editVisibility,
  editTeamCollaboration,
  onSelect,
  onSelectTeamSharing,
  compact = false,
  canSetTournamentVisibility = false,
  canSetTeamVisibility = false,
}: DeckVisibilityBadgeMenuProps) {
  const displayVisibility = isEditing ? editVisibility : normalizeDeckVisibility(deck);
  const displayTeamSharing = isEditing
    ? editTeamCollaboration
    : deckTeamSharingFromDeck(deck);
  const badgeGlyph = createElement(badgeIconForDisplay(displayVisibility, displayTeamSharing), {
    className: "h-3 w-3",
  });
  const badgeLabel =
    displayVisibility === "team"
      ? deckTeamSharingLabel(displayTeamSharing)
      : deckVisibilityLabel(displayVisibility);

  const menuOptions = canSetTournamentVisibility ? OPTIONS : OPTIONS.filter((o) => o.value !== "tournament");

  const publicityBadge = (
    <Badge
      variant={visibilityBadgeVariant(displayVisibility)}
      className={cn(
        compact
          ? "h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px] sm:inline-flex"
          : "h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px] inline-flex",
        isOwner && "cursor-pointer",
      )}
    >
      {badgeGlyph}
      {badgeLabel}
      {isOwner ? <ChevronDown className="h-3 w-3 opacity-70" /> : null}
    </Badge>
  );

  if (!isOwner) {
    return publicityBadge;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {publicityBadge}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-[min(100vw-2rem,22rem)]">
        {menuOptions.map(({ value, label, hint, Icon: MenuIcon }) => (
          <DropdownMenuItem
            key={value}
            className="flex flex-col items-start gap-0.5 py-2"
            onClick={() => onSelect(value)}
          >
            <span className="flex w-full items-center gap-2 font-medium">
              <MenuIcon className="h-4 w-4 shrink-0" />
              {label}
            </span>
            <span className="w-full pl-6 text-[10px] font-normal leading-snug text-muted-foreground">
              {hint}
            </span>
          </DropdownMenuItem>
        ))}
        {canSetTeamVisibility && onSelectTeamSharing ? (
          <>
            <DropdownMenuSeparator />
            {TEAM_SHARING_OPTIONS.map(({ mode, label, hint, Icon: MenuIcon }) => (
              <DropdownMenuItem
                key={mode}
                className="flex flex-col items-start gap-0.5 py-2"
                onClick={() => onSelectTeamSharing(mode)}
              >
                <span className="flex w-full items-center gap-2 font-medium">
                  <MenuIcon className="h-4 w-4 shrink-0" />
                  {label}
                </span>
                <span className="w-full pl-6 text-[10px] font-normal leading-snug text-muted-foreground">
                  {hint}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
