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
    <nav className="relative shrink-0 bg-background pb-[env(safe-area-inset-bottom)]">
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
                <div className="absolute inset-x-2 top-0 h-0.5 bg-primary shadow-[0_0_2px_var(--primary),0_0_6px_var(--primary)/45]" />
              )}
              <Icon className={cn(
                "h-5 w-5 transition-all duration-200",
                isActive && "drop-shadow-[0_0_4px_var(--primary)]"
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
          <Avatar className="h-6 w-6 border border-primary/30 shadow-[0_0_2px_var(--primary)/60,0_0_6px_var(--primary)/35]">
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
