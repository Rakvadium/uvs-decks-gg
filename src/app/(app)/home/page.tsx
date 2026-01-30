"use client";

import { Library, Layers, LayoutGrid, ArrowRight, Hexagon, Users, Zap, Database, Activity, Terminal, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useCardData } from "@/lib/universus";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

function StatCard({ label, value, icon: Icon, delay = 0 }: { label: string; value: string | number; icon: typeof Database; delay?: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function NavCard({ href, icon: Icon, title, description, accentColor = "primary", delay = 0 }: { 
  href: string; 
  icon: typeof LayoutGrid; 
  title: string; 
  description: string;
  accentColor?: "primary" | "secondary" | "accent";
  delay?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60 hover:shadow-[0_0_30px_-5px_var(--primary)]",
    secondary: "from-secondary/20 to-secondary/5 border-secondary/30 hover:border-secondary/60 hover:shadow-[0_0_30px_-5px_var(--secondary)]",
    accent: "from-accent/20 to-accent/5 border-accent/30 hover:border-accent/60 hover:shadow-[0_0_30px_-5px_var(--accent)]",
  };
  const iconClasses = {
    primary: "text-primary drop-shadow-[0_0_8px_var(--primary)]",
    secondary: "text-secondary drop-shadow-[0_0_8px_var(--secondary)]",
    accent: "text-accent drop-shadow-[0_0_8px_var(--accent)]",
  };
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <Link href={href} className="block group">
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-300 ${colorClasses[accentColor]}`}>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-current to-transparent opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-background/50 border border-current/20 backdrop-blur-sm ${iconClasses[accentColor]}`}>
                <Icon className="h-7 w-7" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-display font-semibold uppercase tracking-wider">{title}</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">{description}</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground/60 transition-colors">
              <span>Access</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TerminalLine({ children, prefix = "$", delay = 0 }: { children: React.ReactNode; prefix?: string; delay?: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-2 font-mono text-sm"
    >
      <span className="text-primary">{prefix}</span>
      <span className="text-muted-foreground">{children}</span>
    </motion.div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const { cards, isLoading: cardsLoading } = useCardData();
  const decks = useQuery(api.decks.listByUser, user ? { userId: user._id } : "skip");
  const prefersReducedMotion = usePrefersReducedMotion();

  const totalCards = cards.length;
  const totalDecks = decks?.length ?? 0;
  const username = user?.username ?? "Commander";

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10 space-y-10">
        <motion.div 
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">System Online</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              <span className="text-foreground">Welcome back,</span>
              <br />
              <span className="text-primary drop-shadow-[0_0_20px_var(--primary)]">{username}</span>
            </h1>
            <p className="text-lg md:text-xl font-mono text-muted-foreground max-w-2xl">
              UniVersus Trading Card Game Database Terminal
            </p>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {cardsLoading ? "Syncing..." : "Database Synced"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Ready
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Cards in DB" value={totalCards.toLocaleString()} icon={Database} delay={0.1} />
          <StatCard label="Your Decks" value={totalDecks} icon={Layers} delay={0.2} />
          <StatCard label="Collection" value="0" icon={Library} delay={0.3} />
          <StatCard label="Community" value="Live" icon={Users} delay={0.4} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <NavCard
            href="/gallery"
            icon={LayoutGrid}
            title="Card Gallery"
            description="Browse the complete database of UniVersus cards. Search, filter, and explore."
            accentColor="primary"
            delay={0.2}
          />
          <NavCard
            href="/decks"
            icon={Layers}
            title="Deck Builder"
            description="Create, edit, and optimize your competitive decks with advanced tools."
            accentColor="secondary"
            delay={0.3}
          />
          <NavCard
            href="/collection"
            icon={Library}
            title="Collection"
            description="Track your physical and digital card collection. Monitor your progress."
            accentColor="accent"
            delay={0.4}
          />
        </div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold uppercase tracking-widest text-sm">Quick Access Terminal</h2>
            </div>
            
            <div className="space-y-3 mb-8 p-4 rounded-lg bg-background/50 border border-border/30">
              <TerminalLine delay={0.6}>uvs-system --status</TerminalLine>
              <TerminalLine prefix=">" delay={0.7}>All systems operational</TerminalLine>
              <TerminalLine delay={0.8}>uvs-db --count cards</TerminalLine>
              <TerminalLine prefix=">" delay={0.9}>{totalCards.toLocaleString()} cards indexed and ready</TerminalLine>
              <TerminalLine delay={1.0}>uvs-user --session</TerminalLine>
              <TerminalLine prefix=">" delay={1.1}>Welcome, {username}. Your session is active.</TerminalLine>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button variant="neon" asChild>
                <Link href="/gallery">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Explore Cards
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/decks">
                  <Layers className="mr-2 h-4 w-4" />
                  Create Deck
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/community">
                  <Users className="mr-2 h-4 w-4" />
                  Community
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={prefersReducedMotion ? {} : { opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex items-center justify-center gap-4 py-8 text-xs font-mono text-muted-foreground/40"
        >
          <Hexagon className="h-4 w-4" />
          <span className="uppercase tracking-[0.3em]">UVSDECKS.GG Terminal v1.0</span>
          <Hexagon className="h-4 w-4" />
        </motion.div>
      </div>
    </div>
  );
}
