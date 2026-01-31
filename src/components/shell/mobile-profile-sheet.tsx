"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTheme, useColorScheme, COLOR_SCHEMES } from "@/lib/theme"
import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useMobileShell } from "./mobile-shell-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  LayoutGrid,
  Layers,
  Library,
  Users,
  Moon,
  Sun,
  Palette,
  Settings,
  LogOut,
  Shield,
  LogIn,
  ChevronRight,
} from "lucide-react"
import { useAuthDialog } from "@/components/auth/auth-dialog"

interface NavItem {
  path: string
  label: string
  icon: typeof Home
}

const navItems: NavItem[] = [
  { path: "home", label: "Home", icon: Home },
  { path: "gallery", label: "Card Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "collection", label: "Collection", icon: Library },
  { path: "community", label: "Community", icon: Users },
]

export function MobileProfileSheet() {
  const pathname = usePathname()
  const router = useRouter()
  const authActions = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { isDark, toggleTheme } = useTheme()
  const { colorScheme, setColorScheme } = useColorScheme()
  const { openAuthDialog } = useAuthDialog()
  const { isProfileSheetOpen, setProfileSheetOpen } = useMobileShell()
  
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip")
  const isAdmin = user?.role === "Admin"
  const isOnAdminPage = pathname.startsWith("/admin")

  const handleSignOut = async () => {
    if (authActions?.signOut) {
      await authActions.signOut()
      setProfileSheetOpen(false)
      router.push("/")
    }
  }

  const handleNavClick = (path: string) => {
    router.push(`/${path}`)
    setProfileSheetOpen(false)
  }

  return (
    <Sheet open={isProfileSheetOpen} onOpenChange={setProfileSheetOpen}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col" showCloseButton={false}>
        <SheetHeader className="p-4 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {user?.image && <AvatarImage src={user.image} alt={user.username || "User"} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                  {user?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <SheetTitle className="text-left">
                  {user?.username || "Guest"}
                </SheetTitle>
                <span className="text-sm text-muted-foreground">
                  {user?.email || "Not signed in"}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProfileSheetOpen(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Separator />
          
          <div className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Navigation
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.includes(`/${item.path}`)
                const Icon = item.icon

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preferences
            </p>
            <div className="space-y-1">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span>{isDark ? "Light mode" : "Dark mode"}</span>
              </button>
              <div className="space-y-2 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Palette className="h-5 w-5" />
                  <span>Theme</span>
                </div>
                <div className="ml-8 flex flex-wrap gap-2">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.value}
                      onClick={() => setColorScheme(scheme.value)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        colorScheme === scheme.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      {scheme.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  router.push("/settings")
                  setProfileSheetOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {!isAdmin && <div className="pb-24" />}

          {isAdmin && (
            <>
              <Separator />
              <div className="p-4 pb-24">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Admin
                </p>
                <button
                  onClick={() => {
                    router.push(isOnAdminPage ? "/" : "/admin")
                    setProfileSheetOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {isOnAdminPage ? (
                    <>
                      <Home className="h-5 w-5" />
                      <span>Back to App</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Admin Panel</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 bg-background border-t p-4 flex flex-col gap-3">
          {!isLoading && !isAuthenticated && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-mono font-bold">
                  ?
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Guest</p>
                <p className="text-xs text-muted-foreground">Not signed in</p>
              </div>
            </div>
          )}
          {!isLoading && !isAuthenticated ? (
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() => {
                openAuthDialog()
                setProfileSheetOpen(false)
              }}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          ) : isAuthenticated && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
