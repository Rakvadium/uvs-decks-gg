"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { clearAuthCookies, isRefreshTokenParseError } from "@/components/auth/auth-recovery";
import { sanitizeAgentLoginNextPath } from "@/lib/agent-auth-shared";
import { useHostKind } from "@/games/game-context";
import { createHandoffState, currentApexOrigin } from "@/lib/auth/handoff-client";
import { buildHandoffStartUrl } from "@shared/auth-handoff";

type AgentLoginClientProps = {
  token: string;
  nextPath: string;
  /** Server-side `isAgentAuthEnabled()` (dev only). */
  enabled: boolean;
};

type AgentCredentials = {
  email: string;
  password: string;
  username: string;
};

export function AgentLoginClient({ token, nextPath, enabled }: AgentLoginClientProps) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [status, setStatus] = useState("Preparing agent session…");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const hostKind = useHostKind();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(sanitizeAgentLoginNextPath(nextPath));
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  useEffect(() => {
    if (startedRef.current || isLoading || isAuthenticated) return;
    if (!token) {
      setError("Missing token query parameter");
      setStatus("Agent login failed");
      return;
    }

    startedRef.current = true;

    // Game hosts: sign in on the apex, then hand the session back through /auth/handoff.
    // `state` is generated here so the game host's /auth/callback can verify it.
    if (hostKind === "game") {
      const apex = currentApexOrigin();
      if (!enabled || !apex) {
        setError("Agent login is only available in local development");
        setStatus("Agent login failed");
        return;
      }
      const state = createHandoffState();
      const handoffPath = buildHandoffStartUrl(
        "",
        `${window.location.origin}${sanitizeAgentLoginNextPath(nextPath)}`,
        state,
      );
      setStatus("Redirecting to the main site…");
      window.location.replace(
        `${apex}/agent-login?${new URLSearchParams({ token, next: handoffPath }).toString()}`,
      );
      return;
    }

    let cancelled = false;

    async function establishSession(credentials: AgentCredentials) {
      const signInArgs = {
        email: credentials.email,
        password: credentials.password,
        flow: "signIn" as const,
      };
      const signUpArgs = {
        email: credentials.email,
        password: credentials.password,
        username: credentials.username,
        flow: "signUp" as const,
      };

      try {
        const result = await signIn("password", signInArgs);
        if (!result.signingIn) {
          throw new Error("Sign-in requires an additional step");
        }
        return;
      } catch (signInError) {
        if (isRefreshTokenParseError(signInError)) {
          await clearAuthCookies();
          const retry = await signIn("password", signInArgs);
          if (retry.signingIn) return;
        }
      }

      setStatus("Creating agent account…");
      const signedUp = await signIn("password", signUpArgs);
      if (!signedUp.signingIn) {
        throw new Error("Sign-up requires an additional step");
      }
    }

    async function run() {
      try {
        setStatus("Validating agent secret…");
        const response = await fetch("/api/agent-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: token }),
        });
        const payload = (await response.json().catch(() => null)) as
          | (AgentCredentials & { error?: string })
          | { error?: string }
          | null;

        if (
          !response.ok ||
          !payload ||
          !("email" in payload) ||
          !payload.email ||
          !payload.password ||
          !payload.username
        ) {
          throw new Error(payload?.error || "Agent auth rejected");
        }

        if (cancelled) return;
        setStatus("Signing in…");
        await establishSession({
          email: payload.email,
          password: payload.password,
          username: payload.username,
        });

        if (cancelled) return;
        setStatus("Redirecting…");
        router.replace(sanitizeAgentLoginNextPath(nextPath));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Agent login failed");
        setStatus("Agent login failed");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, hostKind, isAuthenticated, isLoading, nextPath, router, signIn, token]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-3 text-center">
        <PageHeading size="md">Agent login</PageHeading>
        <p className="text-sm text-muted-foreground">{status}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
