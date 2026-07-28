"use client";

import { memo, useEffect, useState } from "react";
import { Layers, LayoutGrid, ArrowRight, Hexagon, Users, Zap, Database, Activity, ChevronRight, Clapperboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useCardData } from "@/lib/universus/card-data-provider";
import * as m from "framer-motion/m";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useAuthDialog } from "@/components/auth/auth-dialog";

function StatCard({ label, value, icon: Icon, delay = 0, animate = true }: { label: string; value: string | number; icon: typeof Database; delay?: number; animate?: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = animate && !prefersReducedMotion;

  return (
    <m.div
      initial={motionEnabled ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="relative flex items-center gap-4 rounded-lg border border-border/50 bg-card/80 p-4 shadow-[var(--chrome-elevation-low)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--chrome-card-border-hover)] hover:shadow-[var(--chrome-elevation-mid)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
      </div>
    </m.div>
  );
}

function NavCard({ href, icon: Icon, title, description, accentColor = "primary", delay = 0, animate = true }: {
  href: string;
  icon: typeof LayoutGrid;
  title: string;
  description: string;
  accentColor?: "primary" | "secondary" | "accent";
  delay?: number;
  animate?: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = animate && !prefersReducedMotion;
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 border-primary/30 hover:border-[var(--chrome-page-nav-card-border-hover)] hover:shadow-[var(--chrome-page-nav-card-shadow-hover)]",
    secondary: "from-secondary/20 to-secondary/5 border-secondary/30 hover:border-[var(--chrome-page-nav-card-border-hover)] hover:shadow-[var(--chrome-page-nav-card-shadow-hover)]",
    accent: "from-accent/20 to-accent/5 border-accent/30 hover:border-[var(--chrome-page-nav-card-border-hover)] hover:shadow-[var(--chrome-page-nav-card-shadow-hover)]",
  };
  const iconClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <m.div
      initial={motionEnabled ? { opacity: 0, y: 30 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <Link href={href} className="group block">
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-[border-color,box-shadow] duration-150 ${colorClasses[accentColor]}`}>
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-current to-transparent opacity-10 blur-3xl transition-opacity duration-150 group-hover:opacity-20" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl border border-current/20 bg-background/50 backdrop-blur-sm ${iconClasses[accentColor]}`} style={{ filter: "var(--chrome-page-nav-card-icon-drop-shadow)" }}>
                <Icon className="h-7 w-7" />
              </div>
              <ArrowRight className="h-5 w-5 -translate-x-2 text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-pretty">{title}</h3>
              <p className="font-mono text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">
              <span>Open</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
}

function HomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const { isLoading: cardsLoading, totalCards: catalogTotalCards } = useCardData();
  const decks = useQuery(api.decks.listByUser, user ? { userId: user._id } : "skip");
  const prefersReducedMotion = usePrefersReducedMotion();
  const { openAuthDialog } = useAuthDialog();
  const [isFirstPaint, setIsFirstPaint] = useState(true);

  useEffect(() => {
    setIsFirstPaint(false);
  }, []);

  const totalCards = catalogTotalCards;
  const totalDecks = decks?.length ?? 0;
  const username = user?.username ?? "Player";
  const introAnimations = !prefersReducedMotion && isFirstPaint;
  const showAuthCta = !isLoading && !isAuthenticated;
  const showPersonalStats = !isLoading && isAuthenticated;
  const cardsLabel = new Intl.NumberFormat().format(totalCards);
  const greetingLead = isAuthenticated ? "Welcome back," : "Build Better Decks";
  const greetingName = isAuthenticated ? username : "UniVersus";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full" style={{ transform: "translateZ(0)" }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: "var(--chrome-page-hero-wash-opacity)" as unknown as number }}>
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-10 p-6 md:p-8 lg:p-10">
        <m.div
          initial={introAnimations ? { opacity: 0, y: -20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-3 w-3 rounded-full bg-green-500" style={{ boxShadow: "var(--chrome-page-status-dot-shadow)", animation: "var(--chrome-decks-heading-dot-animation)" }} />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">UVSDECKS.GG</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
              {isLoading ? "Checking session…" : isAuthenticated ? "Signed in" : "Browsing as guest"}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-4xl font-bold tracking-tight text-pretty md:text-5xl lg:text-6xl">
              <span className="text-foreground">{greetingLead}</span>
              <br />
              <span className="text-primary" style={{ filter: "var(--chrome-page-heading-drop-shadow)" }}>
                {greetingName}
              </span>
            </h1>
            <p className="max-w-2xl font-mono text-lg text-muted-foreground md:text-xl">
              Browse the card gallery, build competitive decks, and explore community tier lists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {cardsLoading ? "Loading catalog…" : "Catalog ready"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${isAuthenticated ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isLoading ? "Linking session…" : isAuthenticated ? `Signed in as ${username}` : "Sign in to save decks"}
              </span>
            </div>
            {showAuthCta ? (
              <>
                <div className="h-4 w-px bg-border" />
                <Button variant="outline" size="sm" onClick={() => openAuthDialog()}>
                  Sign In
                </Button>
              </>
            ) : null}
            <div className="h-4 w-px bg-border" />
            <Button variant="outline" size="sm" asChild>
              <Link href="/tour">
                <Clapperboard className="h-4 w-4" />
                Watch Tour
              </Link>
            </Button>
          </div>
        </m.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Cards Indexed" value={cardsLabel} icon={Database} delay={0.1} animate={introAnimations} />
          <StatCard
            label={showPersonalStats ? "Your Decks" : "Your Decks"}
            value={showPersonalStats ? totalDecks : "—"}
            icon={Layers}
            delay={0.2}
            animate={introAnimations}
          />
          <StatCard label="Community" value="Live" icon={Users} delay={0.3} animate={introAnimations} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <NavCard
            href="/gallery"
            icon={LayoutGrid}
            title="Card Gallery"
            description="Browse the complete UniVersus card database. Search, filter, and explore."
            accentColor="primary"
            delay={0.2}
            animate={introAnimations}
          />
          <NavCard
            href="/decks"
            icon={Layers}
            title="Deck Builder"
            description="Create, edit, and refine decks with main, side, and reference zones."
            accentColor="secondary"
            delay={0.3}
            animate={introAnimations}
          />
          <NavCard
            href="/community"
            icon={Users}
            title="Community"
            description="Explore tier lists, rankings, and what the meta is playing."
            accentColor="primary"
            delay={0.4}
            animate={introAnimations}
          />
        </div>

        <m.div
          initial={introAnimations ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-[var(--chrome-elevation-low)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" style={{ opacity: "var(--chrome-page-hero-wash-opacity)" as unknown as number }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" style={{ opacity: "var(--chrome-page-hero-wash-opacity)" as unknown as number }} />
          <div className="relative z-10 space-y-4 p-6 md:p-8">
            <div className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Next Step</p>
              <h2 className="font-display text-lg uppercase tracking-widest text-pretty">
                {showPersonalStats ? "Keep Building" : "Start Exploring"}
              </h2>
              <p className="max-w-2xl font-mono text-sm text-muted-foreground">
                {showPersonalStats
                  ? `You have ${totalDecks} deck${totalDecks === 1 ? "" : "s"} saved. Jump back into the gallery or open community rankings.`
                  : "You can browse cards and public decks without an account. Sign in when you are ready to save your own lists."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" asChild>
                <Link href="/gallery">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Open Gallery
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/community">
                  <Users className="mr-2 h-4 w-4" />
                  Open Community
                </Link>
              </Button>
              {showAuthCta ? (
                <Button variant="outline" onClick={() => openAuthDialog()}>
                  Sign In
                </Button>
              ) : null}
            </div>
          </div>
        </m.div>

        <m.div
          initial={introAnimations ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex items-center justify-center gap-4 py-8 font-mono text-xs text-muted-foreground"
        >
          <Hexagon className="h-4 w-4" />
          <span className="uppercase tracking-[0.3em]">UVSDECKS.GG</span>
          <Hexagon className="h-4 w-4" />
        </m.div>
      </div>
    </div>
  );
}

export default memo(HomePage);
