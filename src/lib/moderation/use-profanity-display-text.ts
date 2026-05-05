"use client";

import { useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { displayCommunityText, profanityFilterActive } from "./profanity-display-text";
import type { Id } from "../../../convex/_generated/dataModel";

export function useProfanityDisplayText() {
  const user = useQuery(api.user.currentUser);

  const filterEnabled = useMemo(() => {
    if (user === undefined) {
      return true;
    }
    if (user === null) {
      return true;
    }
    return profanityFilterActive(user.profanityFilterEnabled);
  }, [user]);

  const viewerUserId: Id<"users"> | null | undefined = useMemo(() => {
    if (user === undefined) {
      return undefined;
    }
    if (user === null) {
      return null;
    }
    return user._id;
  }, [user]);

  const display = useCallback(
    (text: string, isOwnContent: boolean) => displayCommunityText(text, filterEnabled, isOwnContent),
    [filterEnabled]
  );

  return { display, filterEnabled, viewerUserId };
}
