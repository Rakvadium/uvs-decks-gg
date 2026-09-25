import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getSharedGameModule } from "@shared/games/registry";
import { GAME_IDS, PLATFORM_BRAND } from "@shared/games/types";
import { gameOrigin } from "@shared/hosts";
import { AppBrandMark } from "@/components/brand/mark";
import { GameBadge } from "@/components/shell/game-switcher/game-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kicker, PageHeading, SectionHeading } from "@/components/ui/typography-headings";
import { getRequestGame } from "@/lib/routing/request-game";

export async function generateMetadata(): Promise<Metadata> {
  const { hostKind } = await getRequestGame();
  if (hostKind === "apex") {
    return {
      title: { absolute: `${PLATFORM_BRAND.title} · Choose a game` },
      description: PLATFORM_BRAND.description,
    };
  }
  return {
    title: "Card Gallery",
    description:
      "Browse UniVersus cards, then jump into decks, collection, and community tools on UVSDECKS.GG.",
  };
}

/** Apex (`tcgdecks.gg`) game picker: one card per registered game. */
async function GamePicker() {
  const { host, protocol } = await getRequestGame();
  const root = host.kind === "standalone" ? null : host.root;
  const [lead, accent, suffix] = PLATFORM_BRAND.wordmark;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-background px-6 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <AppBrandMark className="size-14" />
        <PageHeading size="hero" aria-label={PLATFORM_BRAND.title}>
          {lead}
          <span className="text-accent">{accent}</span>
          <span className="text-muted-foreground">{suffix}</span>
        </PageHeading>
        <p className="max-w-md text-muted-foreground">
          Deck building and community tools for trading card games. One account across every game.
        </p>
      </header>

      <section aria-labelledby="game-picker-heading" className="flex w-full max-w-3xl flex-col gap-3">
        <Kicker id="game-picker-heading" className="text-center">
          Choose a game
        </Kicker>
        <ul className="grid gap-4 sm:grid-cols-2">
          {GAME_IDS.map((id) => {
            const gameModule = getSharedGameModule(id);
            const { theme } = gameModule;
            const href = root ? `${gameOrigin(id, root, protocol, host.port)}/gallery` : "/gallery";
            return (
              <li key={id} className="flex">
                <Card className="flex-1 gap-5 p-6">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1"
                    style={{
                      backgroundImage: `linear-gradient(90deg, hsl(${theme.primary}), hsl(${theme.secondary}), hsl(${theme.accent}))`,
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <GameBadge shortName={gameModule.shortName} theme={theme} size="lg" />
                    <div className="min-w-0">
                      <SectionHeading size="lg" className="truncate">
                        {gameModule.displayName}
                      </SectionHeading>
                      <p className="truncate text-sm text-muted-foreground">{gameModule.brand.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Browse the card gallery, build and share decks, and follow community tier lists.
                  </p>
                  <Button asChild className="self-start">
                    <a href={href}>
                      Open {gameModule.shortName}
                      <ArrowUpRight aria-hidden />
                    </a>
                  </Button>
                </Card>
              </li>
            );
          })}
          <li className="flex">
            <div className="flex flex-1 flex-col justify-center gap-1 rounded-lg border border-dashed border-border/80 p-6 text-center">
              <SectionHeading size="sm">More games coming</SectionHeading>
              <p className="text-sm text-muted-foreground">Cyberpunk TCG is next.</p>
            </div>
          </li>
        </ul>
      </section>
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
