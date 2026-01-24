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
    <nav className="shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.includes(`/${item.path}`)
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}

        <button
          onClick={() => setProfileSheetOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground"
        >
          <Avatar className="h-6 w-6">
            {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  )
}
