"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useTheme, useColorScheme, COLOR_SCHEMES, type ChromePreference } from "@/lib/theme";
import * as m from "framer-motion/m";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Palette,
  Moon,
  Sun,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  AtSign,
  Shield,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

const AVATAR_SYMBOLS = [
  { id: "fire", name: "Fire", path: "/universus/symbols/fire.png" },
  { id: "water", name: "Water", path: "/universus/symbols/water.png" },
  { id: "earth", name: "Earth", path: "/universus/symbols/earth.png" },
  { id: "air", name: "Air", path: "/universus/symbols/air.png" },
  { id: "life", name: "Life", path: "/universus/symbols/life.png" },
  { id: "death", name: "Death", path: "/universus/symbols/death.png" },
  { id: "order", name: "Order", path: "/universus/symbols/order.png" },
  { id: "chaos", name: "Chaos", path: "/universus/symbols/chaos.png" },
  { id: "good", name: "Good", path: "/universus/symbols/good.png" },
  { id: "evil", name: "Evil", path: "/universus/symbols/evil.png" },
  { id: "void", name: "Void", path: "/universus/symbols/void.png" },
  { id: "all", name: "All", path: "/universus/symbols/all.png" },
] as const;

export default function SettingsPageClient() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const user = useQuery(api.user.currentUser);
  const updateProfile = useMutation(api.user.updateProfile);
  const { isDark, toggleTheme } = useTheme();
  const { colorScheme, setColorScheme, chromePreference, setChromePreference } = useColorScheme();

  const [username, setUsername] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setImageUrl(user.image || "");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const usernameChanged = username !== (user.username || "");
      const imageChanged = imageUrl !== (user.image || "");
      setHasChanges(usernameChanged || imageChanged);
    }
  }, [username, imageUrl, user]);

  useEffect(() => {
    if (user === null) {
      router.push("/");
    }
  }, [user, router]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        username: username || undefined,
        image: imageUrl || undefined,
      });
      toast.success("Profile updated successfully");
      setHasChanges(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (user === undefined || user === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const memberSince = new Date(user._creationTime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </m.div>

        <div className="space-y-6">
          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 border-2 border-muted">
                    {imageUrl && <AvatarImage src={imageUrl} alt={username || "User"} />}
                    <AvatarFallback className="bg-primary/10 text-2xl font-medium text-primary">
                      {username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center gap-2">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Avatar Symbol
                  </Label>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {AVATAR_SYMBOLS.map((symbol) => (
                      <button
                        key={symbol.id}
                        type="button"
                        onClick={() => setImageUrl(symbol.path)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:border-primary/50 hover:bg-muted/50",
                          imageUrl === symbol.path
                            ? "border-primary bg-primary/10"
                            : "border-muted"
                        )}
                      >
                        <div className="relative h-10 w-10">
                          <Image
                            src={symbol.path}
                            alt={symbol.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-xs font-medium">{symbol.name}</span>
                        {imageUrl === symbol.path && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {imageUrl && !AVATAR_SYMBOLS.some(s => s.path === imageUrl) && (
                    <p className="text-xs text-muted-foreground">
                      You have a custom avatar. Select a symbol above to change it.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {user.email || "No email set"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member since {memberSince}
                    </div>
                    {user.role && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">{user.role}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </m.div>

          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the app looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {isDark ? (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      )}
                      Dark Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="gap-2"
                  >
                    {isDark ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Color Theme
                  </Label>
                  <Select value={colorScheme} onValueChange={(value) => setColorScheme(value as typeof colorScheme)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_SCHEMES.map((scheme) => (
                        <SelectItem key={scheme.value} value={scheme.value}>
                          {scheme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.value}
                      onClick={() => setColorScheme(scheme.value as typeof colorScheme)}
                      className={cn(
                        "group relative rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50",
                        colorScheme === scheme.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                            colorScheme === scheme.value
                              ? "bg-primary ring-primary"
                              : "bg-muted ring-transparent group-hover:ring-muted"
                          )}
                        />
                        <span className="text-sm font-medium">{scheme.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Chrome
                  </Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Calm</span> uses flat surfaces, neutral elevation, and sans headings.
                      <span className="font-medium text-foreground"> Expressive</span> keeps glow, display typography, and stronger depth.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Auto</span> picks chrome from your color scheme: Holoterminal and most palettes stay expressive; Default and Calm Storm use calm. Choose Calm or Expressive here to override.
                    </p>
                  </div>
                  <Select
                    value={chromePreference}
                    onValueChange={(value) => setChromePreference(value as ChromePreference)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select chrome mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (from color scheme)</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="expressive">Expressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>
      </div>
    </div>
  );
}

