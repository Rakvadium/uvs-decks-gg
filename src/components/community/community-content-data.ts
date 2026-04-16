import { Calendar, Layers, MessageCircle, Radio, Sparkles, Star, Users, type LucideIcon } from "lucide-react";

export const FEATURED_BUILDERS = [
  {
    name: "NovaEdge",
    handle: "@novaedge",
    focus: "Control / Tempo",
    activity: "48 decklists",
    cadence: "3 updates / week",
    status: "Hot thread",
    tags: ["Meta Briefings", "Deck Tech", "Matchup Labs"],
    accent: "from-primary/30 via-primary/10 to-transparent",
  },
  {
    name: "RiftStream",
    handle: "@riftstream",
    focus: "Aggro / Midrange",
    activity: "32 decklists",
    cadence: "Weekly write-ups",
    status: "Patch recap",
    tags: ["Rapid Builds", "Tournament Recaps", "Starter Guides"],
    accent: "from-secondary/30 via-secondary/10 to-transparent",
  },
  {
    name: "ArcLight",
    handle: "@arclight",
    focus: "Combo / Rogue",
    activity: "19 decklists",
    cadence: "Monthly deep dives",
    status: "Deck spotlight",
    tags: ["Rogue Tech", "Builder Notes", "Sideboard Plans"],
    accent: "from-emerald-400/30 via-emerald-400/10 to-transparent",
  },
] as const;

export const COMMUNITY_PULSE = [
  {
    title: "Matchup matrix: Control vs Tempo",
    author: "ArcLight",
    time: "2h ago",
    comments: 48,
    icon: MessageCircle,
  },
  {
    title: "Patch 1.12 quick reads",
    author: "RiftStream",
    time: "6h ago",
    comments: 92,
    icon: Sparkles,
  },
  {
    title: "Deck spotlight queue open",
    author: "NovaEdge",
    time: "1d ago",
    comments: 31,
    icon: Star,
  },
] as const;

export const COMMUNITY_EVENTS = [
  { label: "Community Roundtable", time: "Friday • 6 PM PT", icon: Calendar },
  { label: "Meta Snapshot Live", time: "Saturday • 1 PM PT", icon: Radio },
  { label: "Open Playtest Night", time: "Sunday • 11 AM PT", icon: Users },
] as const;

export const COMMUNITY_LABS: Array<{
  title: string;
  description: string;
  kicker: string;
  icon: LucideIcon;
}> = [
  {
    title: "Tier List Lab",
    description: "Rank card pools with custom tiers and publish them to the feed.",
    kicker: "Open lab",
    icon: Layers,
  },
  {
    title: "Matchup Threads",
    description: "Share lines, sideboard plans, and key sequencing tips.",
    kicker: "Active threads",
    icon: MessageCircle,
  },
  {
    title: "Meta Polls",
    description: "Vote on rising archetypes and tech packages.",
    kicker: "Weekly polls",
    icon: Sparkles,
  },
  {
    title: "Playtest Queue",
    description: "Find sparring partners and schedule sets fast.",
    kicker: "Open queue",
    icon: Users,
  },
] as const;

export const COMMUNITY_RESOURCES: Array<{
  label: string;
  detail: string;
  cta: string;
  icon: LucideIcon;
}> = [
  {
    label: "Patch Digest",
    detail: "Weekly meta and rules recap assembled from top threads.",
    cta: "Read digest",
    icon: Sparkles,
  },
  {
    label: "Event Calendar",
    detail: "Track tournaments, roundtables, and live community sessions.",
    cta: "Open calendar",
    icon: Calendar,
  },
  {
    label: "Deck Database",
    detail: "Browse spotlighted builds and compare recent ladder lists.",
    cta: "Browse decks",
    icon: Layers,
  },
] as const;
