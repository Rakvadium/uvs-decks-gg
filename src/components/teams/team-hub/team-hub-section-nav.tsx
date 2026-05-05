"use client";

import { BarChart3, Calendar, Layers, Megaphone, MessageSquare, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

const TAB_MEMBERS = "members";
const TAB_DECKS = "decks";
const TAB_ANNOUNCEMENTS = "announcements";
const TAB_CHAT = "chat";
const TAB_CALENDAR = "calendar";
const TAB_STATS = "stats";

type TeamHubSectionNavProps = {
  teamId: string;
  className?: string;
};

function pathnameToTab(teamId: string, pathname: string): string {
  const base = `/teams/${teamId}`;
  if (pathname === base || pathname === `${base}/`) return TAB_ANNOUNCEMENTS;
  if (pathname === `${base}/members`) return TAB_MEMBERS;
  if (pathname === `${base}/decks`) return TAB_DECKS;
  if (pathname === `${base}/announcements`) return TAB_ANNOUNCEMENTS;
  if (pathname === `${base}/chat`) return TAB_CHAT;
  if (pathname === `${base}/calendar`) return TAB_CALENDAR;
  if (pathname === `${base}/stats`) return TAB_STATS;
  return TAB_ANNOUNCEMENTS;
}

export function TeamHubSectionNav({ teamId, className }: TeamHubSectionNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/teams/${teamId}`;

  const value = useMemo(() => pathnameToTab(teamId, pathname), [teamId, pathname]);

  const onValueChange = useCallback(
    (v: string) => {
      switch (v) {
        case TAB_MEMBERS:
          router.push(`${base}/members`);
          break;
        case TAB_DECKS:
          router.push(`${base}/decks`);
          break;
        case TAB_ANNOUNCEMENTS:
          router.push(`${base}/announcements`);
          break;
        case TAB_CHAT:
          router.push(`${base}/chat`);
          break;
        case TAB_CALENDAR:
          router.push(`${base}/calendar`);
          break;
        case TAB_STATS:
          router.push(`${base}/stats`);
          break;
        default:
          router.push(`${base}/announcements`);
      }
    },
    [router, base],
  );

  return (
    <nav className={cn("min-w-0", className)} aria-label="Team hub sections">
      <SegmentedControl
        size="sm"
        className="w-max min-w-0 max-w-none"
        value={value}
        onValueChange={onValueChange}
        items={[
          { value: TAB_ANNOUNCEMENTS, label: <span>News</span>, icon: Megaphone },
          { value: TAB_CHAT, label: <span>Chat</span>, icon: MessageSquare },
          { value: TAB_DECKS, label: <span>Decks</span>, icon: Layers },
          { value: TAB_STATS, label: <span>Stats</span>, icon: BarChart3 },
          { value: TAB_MEMBERS, label: <span>Members</span>, icon: Users },
          { value: TAB_CALENDAR, label: <span>Calendar</span>, icon: Calendar },
        ]}
      />
    </nav>
  );
}
