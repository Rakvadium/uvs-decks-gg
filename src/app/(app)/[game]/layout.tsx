import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isGameId } from "@shared/games/types";

/**
 * Game-scoped routes. Only reachable through the middleware rewrite `/gallery` → `/{game}/gallery`
 * (see docs/multi-game.md "Hosts and routing"); user-visible URLs never contain the game.
 */
export default async function GameLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!isGameId(game)) {
    notFound();
  }
  return children;
}
