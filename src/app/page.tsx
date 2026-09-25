import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GAME_IDS } from "@shared/games/types";
import { getSharedGameModule } from "@shared/games/registry";
import { gameOrigin, resolveHost } from "@shared/hosts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/typography-headings";
import { getRequestGame } from "@/lib/routing/request-game";

export const metadata: Metadata = {
  title: "Card Gallery",
  description:
    "Browse UniVersus cards, then jump into decks, collection, and community tools on UVSDECKS.GG.",
};

/** Apex (`tcgdecks.gg`) game picker. Minimal for now; a later step polishes it. */
async function GamePicker() {
  const h = await headers();
  const host = resolveHost(h.get("host"));
  const root = host.kind === "standalone" ? null : host.root;
  const protocol = h.get("x-forwarded-proto");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="text-center">
        <PageHeading size="hero">TCGDECKS.GG</PageHeading>
        <p className="mt-3 text-muted-foreground">Choose a game</p>
      </div>
      <ul className="grid w-full max-w-md gap-4">
        {GAME_IDS.map((id) => {
          const gameModule = getSharedGameModule(id);
          const href = root ? `${gameOrigin(id, root, protocol, host.port)}/gallery` : "/gallery";
          return (
            <li key={id}>
              <a href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardTitle>{gameModule.displayName}</CardTitle>
                    <CardDescription>
                      Build {gameModule.shortName} decks and browse the card gallery.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default async function RootPage() {
  const { hostKind } = await getRequestGame();
  if (hostKind === "apex") {
    return <GamePicker />;
  }
  redirect("/gallery");
}
