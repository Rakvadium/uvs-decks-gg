"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { AppBrandMark } from "@/components/brand/mark";
import { AppBrandWordmark } from "@/components/brand/wordmark";
import { Surface } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SectionHeading } from "@/components/ui/typography-headings";
import { useBrand, useHostKind } from "@/games/game-context";
import { startHandoff } from "@/lib/auth/handoff-client";
import type { AuthPageTarget } from "@/lib/auth/auth-page-target";
import { AuthStatusScreen } from "./auth-status-screen";
import { authPageHref, type AuthEntryFlow, type AuthFlow } from "./flow";
import { ResetPasswordForm } from "./reset-password-form";
import { SignInForm } from "./sign-in-form/content";
import { SignUpForm } from "./sign-up-form/content";

type AuthPageProps = AuthPageTarget & {
  initialFlow: AuthEntryFlow;
};

const ENTRY_TABS = [
  { value: "signIn", label: "Sign in" },
  { value: "signUp", label: "Create account" },
];

const ENTRY_COPY: Record<AuthEntryFlow, { title: string; description: string }> = {
  signIn: {
    title: "Welcome back",
    description: "Sign in to build decks, track your collection, and join the community.",
  },
  signUp: {
    title: "Create your account",
    description: "Build and share decks, save collections, and vote on tier lists.",
  },
};

/** `/sign-in` and `/sign-up`: full-page auth. Game hosts hand off to the apex version. */
export function AuthPage({ initialFlow, nextPath, returnTo }: AuthPageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const hostKind = useHostKind();
  const brand = useBrand();
  const [flow, setFlow] = useState<AuthFlow>(initialFlow);
  const handoffStartedRef = useRef(false);
  const destination = nextPath ?? "/home";
  const handsOff = hostKind === "game";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(destination);
    }
  }, [destination, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!handsOff || isLoading || isAuthenticated || handoffStartedRef.current) return;
    handoffStartedRef.current = true;
    startHandoff(destination, { flow: initialFlow });
  }, [destination, handsOff, initialFlow, isAuthenticated, isLoading]);

  const changeFlow = useCallback(
    (next: AuthFlow) => {
      setFlow(next);
      if (next !== "reset") {
        window.history.replaceState(null, "", authPageHref(next, nextPath));
      }
    },
    [nextPath],
  );

  const handleSuccess = useCallback(() => {
    router.replace(destination);
  }, [destination, router]);

  if (handsOff) {
    return <AuthStatusScreen heading="Signing in" status="Redirecting to sign in…" />;
  }
  if (isAuthenticated) {
    return <div className="min-h-dvh bg-background" aria-busy="true" />;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label={brand.title} className="flex items-center gap-3">
          <AppBrandMark className="size-10" />
          <AppBrandWordmark layout="inline" />
        </Link>
        {returnTo ? (
          <p className="text-sm text-muted-foreground">
            Continue to <span className="font-medium text-foreground">{returnTo.label}</span>
          </p>
        ) : null}
      </header>

      <Surface className="w-full max-w-sm gap-0 py-0 hover:shadow-[var(--chrome-elevation-low)]">
        <div className="p-6">
          {flow === "reset" ? (
            <ResetPasswordForm setFlow={changeFlow} onSuccess={handleSuccess} />
          ) : (
            <>
              <SegmentedControl
                items={ENTRY_TABS}
                value={flow}
                onValueChange={(value) => changeFlow(value as AuthEntryFlow)}
                stretch
                className="mb-6"
              />
              <div className="mb-6 space-y-1">
                <SectionHeading size="lg">{ENTRY_COPY[flow].title}</SectionHeading>
                <p className="text-sm text-muted-foreground">{ENTRY_COPY[flow].description}</p>
              </div>
              {flow === "signIn" ? (
                <SignInForm setFlow={changeFlow} onSuccess={handleSuccess} />
              ) : (
                <SignUpForm onSuccess={handleSuccess} />
              )}
            </>
          )}
        </div>
      </Surface>

      <footer className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
        {hostKind === "apex" ? <p>One account works across every game on {brand.title}.</p> : null}
        {returnTo ? (
          <a href={returnTo.href} className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
            <ArrowLeft className="size-4" />
            Back to {returnTo.label}
          </a>
        ) : (
          <Link href="/" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        )}
      </footer>
    </main>
  );
}
