import Link from "next/link";
import { Home, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui/typography-headings";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarNav() {
  const { collapsed, isOnAdminPage, navItems, pathname, prefersReducedMotion } = useLeftSidebarContext();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-2">
      {!isOnAdminPage
        ? navItems.map((item, index) => {
            const href = `/${item.path}`;
            const isActive = pathname.includes(`/${item.path}`);
            const Icon = item.icon;

            const navLink = (
              <Link key={item.path} href={href}>
                <motion.div
                  initial={false}
                  whileHover={prefersReducedMotion ? undefined : { x: collapsed ? 0 : 4 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    "render-stable relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "border-primary/30 bg-primary/15 text-primary shadow-[var(--chrome-shell-nav-active-shadow)]"
                      : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      isActive && "[filter:var(--chrome-shell-icon-drop-shadow)]"
                    )}
                  />
                  {!collapsed ? (
                    <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">
                      {item.label}
                    </span>
                  ) : null}
                  {isActive ? (
                    <motion.div
                      initial={false}
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-md border border-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  ) : null}
                </motion.div>
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLink;
          })
        : null}

      {isOnAdminPage ? (
        <div className={cn("flex items-center gap-2 px-3 py-2.5 text-sm font-semibold", collapsed && "justify-center px-2")}>
          <Shield className="h-4 w-4 shrink-0 text-primary [filter:var(--chrome-shell-icon-drop-shadow)]" />
          {!collapsed ? (
            <Kicker className="whitespace-nowrap font-display text-primary">
              Admin Panel
            </Kicker>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1" />

      {isOnAdminPage ? (
        <Link href="/" className={cn("rounded-md px-3 py-2 text-xs font-mono uppercase tracking-wider text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground", collapsed && "text-center") }>
          <span className="inline-flex items-center gap-2">
            <Home className="h-3.5 w-3.5" />
            {!collapsed ? "Back to App" : "Home"}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
