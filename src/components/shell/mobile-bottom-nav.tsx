"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { LayoutGrid, Layers, Users, type LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMobileShell } from "./mobile-shell-context"
import {
  SHELL_CHROME_SURFACE,
  SHELL_CHROME_WASH_STYLE,
} from "./shell-chrome"

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: "gallery", label: "Cards", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "community", label: "Community", icon: Users },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip")
  const { setProfileSheetOpen } = useMobileShell()

  return (
    <nav
      className={cn("shrink-0 pb-[env(safe-area-inset-bottom)]", SHELL_CHROME_SURFACE)}
      aria-label="Primary"
    >
      <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />
      <div className="relative flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.includes(`/${item.path}`)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={`/${item.path}`}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1.5 py-2 transition-[color,opacity] duration-200",
                isActive
                  ? "text-accent"
                  : "text-sidebar-foreground hover:text-accent"
              )}
            >
              {isActive ? (
                <div className="absolute inset-x-2 top-0 h-0.5 bg-accent shadow-[0_0_3px_color-mix(in_oklch,var(--accent)_50%,transparent),0_0_12px_color-mix(in_oklch,var(--accent)_32%,transparent)]" />
              ) : null}
              <Icon
                className={cn(
                  "h-5 w-5 transition-[filter] duration-200",
                  isActive && "[filter:var(--chrome-shell-icon-drop-shadow)]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-mono uppercase tracking-widest",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setProfileSheetOpen(true)}
          className="relative flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-sidebar-foreground transition-[color] duration-200 hover:text-accent"
          aria-label="Open profile"
        >
          <Avatar className="h-6 w-6 border border-accent/35 shadow-[var(--chrome-shell-avatar-ring)]">
            {user?.image ? <AvatarImage src={user.image} alt={user.username || "User"} /> : null}
            <AvatarFallback className="bg-accent/20 font-mono text-xs font-bold text-accent">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-mono uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </nav>
  )
}
