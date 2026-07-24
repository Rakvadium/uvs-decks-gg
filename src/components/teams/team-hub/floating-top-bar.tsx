"use client";

import { BarChart3, Calendar, Layers, Megaphone, MessageSquare, Plus, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  FloatingActionPill,
  FloatingPageBar,
  FloatingTabsPill,
} from "@/components/shell/floating-page-bar";
import { useTeamHubPrimaryAction } from "./primary-action-context";
import { TeamIdentityPill } from "./team-identity-pill";
import type { TeamLogoPresentation } from "./use-team-logo-picker";

const TAB_MEMBERS = "members";
const TAB_DECKS = "decks";
const TAB_ANNOUNCEMENTS = "announcements";
const TAB_CHAT = "chat";
const TAB_CALENDAR = "calendar";
const TAB_STATS = "stats";

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

export function TeamHubFloatingTopBar({
  teamId,
  teamName,
  logoPresentation,
  loading,
}: {
  teamId: string;
  teamName: string | null;
  logoPresentation: TeamLogoPresentation | null | undefined;
  loading: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const primaryAction = useTeamHubPrimaryAction();
  const base = `/teams/${teamId}`;
  const value = useMemo(() => pathnameToTab(teamId, pathname), [teamId, pathname]);
  const ActionIcon = primaryAction?.icon ?? Plus;

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
    [router, base]
  );

  return (
    <FloatingPageBar
      left={
        <>
          <TeamIdentityPill
            teamId={teamId as Id<"teams">}
            name={teamName}
            presentation={logoPresentation}
            loading={loading}
          />
          <FloatingTabsPill
            value={value}
            onValueChange={onValueChange}
            items={[
              { value: TAB_ANNOUNCEMENTS, label: "News", icon: Megaphone },
              { value: TAB_CHAT, label: "Chat", icon: MessageSquare },
              { value: TAB_DECKS, label: "Decks", icon: Layers },
              { value: TAB_STATS, label: "Stats", icon: BarChart3 },
              { value: TAB_MEMBERS, label: "Members", icon: Users },
              { value: TAB_CALENDAR, label: "Calendar", icon: Calendar },
            ]}
          />
        </>
      }
      right={
        primaryAction ? (
          <FloatingActionPill onClick={primaryAction.onClick}>
            <ActionIcon className="h-3.5 w-3.5" />
            <span className="text-xs">{primaryAction.label}</span>
          </FloatingActionPill>
        ) : null
      }
    />
  );
}
