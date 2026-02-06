import {
  BadgeCheck,
  Flame,
  MessageCircle,
  Radio,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

export const CREATOR_TOOLKIT: Array<{
  title: string;
  description: string;
  kicker: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    title: "YouTube Sync",
    description: "Auto-ingest new uploads and surface highlights in the feed.",
    kicker: "Connect channel",
    icon: Video,
    accent: "from-primary/30 via-primary/10 to-transparent",
  },
  {
    title: "Community Posts",
    description: "Publish patch notes, deck updates, and run polls with followers.",
    kicker: "Create updates",
    icon: MessageCircle,
    accent: "from-secondary/30 via-secondary/10 to-transparent",
  },
  {
    title: "Creator Profile",
    description: "Showcase videos, decks, and your personal meta notes.",
    kicker: "Customize modules",
    icon: BadgeCheck,
    accent: "from-emerald-400/30 via-emerald-400/10 to-transparent",
  },
  {
    title: "Deck Spotlights",
    description: "Feature community builds with tier notes and matchup tips.",
    kicker: "Queue submissions",
    icon: Trophy,
    accent: "from-cyan-400/30 via-cyan-400/10 to-transparent",
  },
] as const;

export const VERIFICATION_STEPS = [
  { title: "Apply", description: "Share your channel, socials, and deck focus." },
  { title: "Verify", description: "Identity and channel review in 24-48 hours." },
  { title: "Sync", description: "Connect YouTube and import your latest uploads." },
  { title: "Launch", description: "Publish posts, run polls, and spotlight decks." },
] as const;

export const CREATOR_BENEFITS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Subscriber Labs",
    description: "Host playtest rooms with gated decklists and feedback.",
    icon: Users,
  },
  {
    title: "Live Meta Rooms",
    description: "Go live with community roundtables and patch breakdowns.",
    icon: Radio,
  },
  {
    title: "Early Access",
    description: "Get first access to creator analytics and new tools.",
    icon: Flame,
  },
] as const;

export const CONTENT_FORMATS = [
  "Meta Briefings",
  "Deck Techs",
  "Sideboard Guides",
  "Patch Notes",
  "Spotlight Series",
  "Community Polls",
] as const;

export const HERO_STATS: Array<{ label: string; value: string; icon: LucideIcon }> = [
  { label: "Creator Labs", value: "24 live", icon: Users },
  { label: "Weekly Drops", value: "35+", icon: Video },
  { label: "Review Time", value: "24-48h", icon: Sparkles },
] as const;
