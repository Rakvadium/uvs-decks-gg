"use client"

import { usePathname, useRouter } from "next/navigation"
import { useMobileShell } from "./mobile-shell-context"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { LayoutGrid, Layers, Library } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutGrid
}

const navItems: NavItem[] = [
  { path: "gallery", label: "Cards", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip")
  const { setProfileSheetOpen } = useMobileShell()

  const handleNavClick = (path: string) => {
    router.push(`/${path}`)
  }

  return (
    <nav className="shrink-0 border-t border-primary/20 bg-sidebar/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.includes(`/${item.path}`)
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1.5 py-2 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-x-2 top-0 h-0.5 bg-primary shadow-[0_0_10px_var(--primary)]" />
              )}
              <Icon className={cn(
                "h-5 w-5 transition-all duration-200",
                isActive && "drop-shadow-[0_0_8px_var(--primary)]"
              )} />
              <span className={cn(
                "text-[10px] font-mono uppercase tracking-widest",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}

        <button
          onClick={() => setProfileSheetOpen(true)}
          className="relative flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Avatar className="h-6 w-6 border border-primary/30 shadow-[0_0_8px_-2px_var(--primary)]">
            {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono font-bold">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-mono uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </nav>
  )
}
