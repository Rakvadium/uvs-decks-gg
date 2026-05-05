"use client";

import { useState, useEffect, useOptimistic, useTransition, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useColorScheme, COLOR_SCHEMES, CHROME_OPTIONS } from "@/lib/theme";
import type {
  AppearanceModePair,
  ChromeVariant,
  ColorPresetChoice,
  ThemePreference,
} from "@/lib/theme/appearance-types";
import { DEFAULT_CUSTOM_BRAND } from "@/lib/theme/appearance-types";
import * as m from "framer-motion/m";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Monitor,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  AtSign,
  Shield,
  Calendar,
  Sparkles,
  Filter,
  ChevronDown,
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

const MODE_OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function pickerHex(hex: string) {
  const m = /^#([0-9a-fA-F]{6})/.exec(hex.trim());
  return m ? `#${m[1]}` : "#000000";
}

function ModePairPickers({
  title,
  pair,
  onChange,
  dense,
}: {
  title?: string;
  pair: AppearanceModePair;
  onChange: (next: AppearanceModePair) => void;
  dense?: boolean;
}) {
  const bump = (
    side: keyof AppearanceModePair,
    key: "primary" | "secondary",
    value: string,
  ) =>
    onChange({
      ...pair,
      [side]: { ...pair[side], [key]: pickerHex(value) },
    });

  return (
    <div
      className={cn(
        "rounded-lg border border-border p-4 space-y-3",
        dense && "border-0 p-0",
      )}
    >
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Light</p>
          <ColorSwatchRow
            label="Primary"
            value={pair.light.primary}
            onChange={(next) => bump("light", "primary", next)}
          />
          <ColorSwatchRow
            label="Secondary"
            value={pair.light.secondary}
            onChange={(next) => bump("light", "secondary", next)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Dark</p>
          <ColorSwatchRow
            label="Primary"
            value={pair.dark.primary}
            onChange={(next) => bump("dark", "primary", next)}
          />
          <ColorSwatchRow
            label="Secondary"
            value={pair.dark.secondary}
            onChange={(next) => bump("dark", "secondary", next)}
          />
        </div>
      </div>
    </div>
  );
}

function ColorSwatchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const safePick = pickerHex(value);
  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs font-normal text-muted-foreground">{label}</Label>
      <input
        aria-label={`${label} color`}
        type="color"
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
        value={safePick}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function SettingsPageClient() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const user = useQuery(api.user.currentUser);
  const updateProfile = useMutation(api.user.updateProfile);
  const setProfanityFilterEnabled = useMutation(api.user.setProfanityFilterEnabled);
  const [, startProfanityFilterTransition] = useTransition();
  const [profanityFilterOptimistic, setProfanityFilterOptimistic] = useOptimistic(
    user?.profanityFilterEnabled ?? true,
    (_state, next: boolean) => next,
  );
  const onProfanityFilterChange = useCallback(
    (next: boolean) => {
      if (!user) return;
      const before = user.profanityFilterEnabled;
      startProfanityFilterTransition(() => {
        setProfanityFilterOptimistic(next);
      });
      void (async () => {
        try {
          await setProfanityFilterEnabled({ enabled: next });
          toast.success(
            next
              ? "You’ll see filtered text in community content where supported"
              : "You’ll see unfiltered text where the app supports it",
          );
        } catch {
          startProfanityFilterTransition(() => {
            setProfanityFilterOptimistic(before);
          });
          toast.error("Couldn’t update language filter");
        }
      })();
    },
    [user, setProfanityFilterEnabled, setProfanityFilterOptimistic, startProfanityFilterTransition],
  );
  const {
    theme,
    setTheme,
    resolvedTheme,
    colorSource,
    isCustomAppearance,
    setAppearancePreset,
    setAppearanceCustom,
    touchAppearanceCustom,
    chrome,
    setChrome,
  } = useColorScheme();

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#appearance") return;
    queueMicrotask(() => {
      document.getElementById("appearance")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
            transition={{ delay: prefersReducedMotion ? 0 : 0.15, duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Community content
                </CardTitle>
                <CardDescription>
                  How text from others is shown in feeds, lists, and social surfaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <Label htmlFor="profanity-filter" className="text-base">
                      Filter strong language in community content
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Affects <span className="font-medium text-foreground">display</span> on your device: you see masked or softened wording where the app supports it.{" "}
                      <span className="font-medium text-foreground">Publishing</span> public or team-visible text is handled separately and may add server checks later.
                    </p>
                  </div>
                  <Switch
                    id="profanity-filter"
                    className="shrink-0 mt-0.5"
                    checked={profanityFilterOptimistic}
                    onCheckedChange={onProfanityFilterChange}
                  />
                </div>
              </CardContent>
            </Card>
          </m.div>

          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <Card id="appearance" className="scroll-mt-28">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Mode affects light or dark palettes. Colors and chrome are chosen independently.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Appearance mode</Label>
                  <div className="flex flex-wrap gap-2">
                    {MODE_OPTIONS.map(({ value: modeValue, label, icon: Icon }) => (
                      <Button
                        key={modeValue}
                        type="button"
                        variant={theme === modeValue ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => setTheme(modeValue)}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Now showing{" "}
                    <span className="font-medium text-foreground">
                      {resolvedTheme === "dark" ? "dark" : "light"}
                    </span>
                    {theme === "system" ? ", following your device." : "."}
                  </p>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Color palette
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Presets adjust semantic colors only. Switching palette does not change chrome or mode.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {COLOR_SCHEMES.map((scheme) => {
                      const active =
                        colorSource.kind === "preset" &&
                        colorSource.preset === (scheme.value as ColorPresetChoice);
                      return (
                        <button
                          key={scheme.value}
                          type="button"
                          onClick={() =>
                            void setAppearancePreset(scheme.value as ColorPresetChoice)
                          }
                          className={cn(
                            "group relative rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50",
                            active
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                                active
                                  ? "bg-primary ring-primary"
                                  : "bg-muted ring-transparent group-hover:ring-muted",
                              )}
                            />
                            <span className="text-sm font-medium">{scheme.label}</span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        void setAppearanceCustom(
                          colorSource.kind === "custom"
                            ? colorSource.custom
                            : { fallback: DEFAULT_CUSTOM_BRAND },
                        )
                      }
                      className={cn(
                        "group relative rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50 sm:col-span-1 col-span-2",
                        isCustomAppearance
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                            isCustomAppearance
                              ? "bg-primary ring-primary"
                              : "bg-muted ring-transparent group-hover:ring-muted",
                          )}
                        />
                        <span className="text-sm font-medium">Custom</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose primary and secondary for light and dark.
                      </p>
                    </button>
                  </div>
                </div>

                {colorSource.kind === "custom" ? (
                  <div className="space-y-4 border-t pt-4">
                    <ModePairPickers
                      title="Shared palette"
                      pair={colorSource.custom.fallback}
                      onChange={(next) =>
                        touchAppearanceCustom((draft) => ({ ...draft, fallback: next }))
                      }
                    />
                    <Collapsible>
                      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm font-medium hover:bg-muted/60 [&[data-state=open]_svg:first-child]:rotate-180">
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                        Per-chrome color overrides
                        <Badge variant="secondary" className="ml-auto text-[10px] uppercase">
                          Advanced
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <p className="text-sm text-muted-foreground">
                          Optional palettes when a specific chrome is active. Clearing a row falls back to the shared palette.
                        </p>
                        <div className="space-y-4">
                          {CHROME_OPTIONS.map((opt) => {
                            const customDraft = colorSource.custom;
                            const pairForChrome =
                              customDraft.byChrome?.[opt.id] ?? customDraft.fallback;
                            const hasOverride = Boolean(customDraft.byChrome?.[opt.id]);

                            return (
                              <div
                                key={opt.id}
                                className="rounded-xl border border-border bg-muted/20 p-3 space-y-2"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium">{opt.label}</p>
                                      {hasOverride ? (
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                          Override
                                        </Badge>
                                      ) : (
                                        <span className="text-[10px] uppercase text-muted-foreground">
                                          inherits shared palette
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                                  </div>
                                  {hasOverride ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        touchAppearanceCustom((draft) => {
                                          if (!draft.byChrome?.[opt.id]) return draft;
                                          const rest = { ...draft.byChrome };
                                          delete rest[opt.id];
                                          return {
                                            ...draft,
                                            byChrome:
                                              Object.keys(rest).length > 0 ? rest : undefined,
                                          };
                                        })
                                      }
                                    >
                                      Clear
                                    </Button>
                                  ) : null}
                                </div>
                                <ModePairPickers
                                  dense
                                  pair={pairForChrome}
                                  onChange={(next) =>
                                    touchAppearanceCustom((draft) => ({
                                      ...draft,
                                      byChrome: { ...draft.byChrome, [opt.id]: next },
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ) : null}

                <div className="space-y-3 border-t pt-4">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Chrome
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Chrome adjusts shape, typography, shadows, and motion accents. It does not pick your hues.
                  </p>
                  <Select
                    value={chrome}
                    onValueChange={(value) => void setChrome(value as ChromeVariant)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select chrome" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHROME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {CHROME_OPTIONS.find((opt) => opt.id === chrome)?.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>
      </div>
    </div>
  );
}

