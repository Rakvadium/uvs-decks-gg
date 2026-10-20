"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { clearAuthCookies, isRefreshTokenParseError } from "@/components/auth/auth-recovery";
import { parseAgentLoginFragment } from "@/lib/agent-auth-shared";

type Fragment = ReturnType<typeof parseAgentLoginFragment>;
type SignIn = ReturnType<typeof useAuthActions>["signIn"];

const FAILED = "Agent login failed";

// Module scope, not component state: the page can remount while it loads, and the hash is gone
// after the first read. Each code is redeemed at most once per page load.
let captured: Fragment | null = null;
let redemption: Promise<boolean> | null = null;

/** Reads `#code=…&next=…` once and removes it from the address bar and history entry. */
function captureFragment(): Fragment {
  if (captured === null || window.location.hash) {
    captured = parseAgentLoginFragment(window.location.hash);
    redemption = null;
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
  }
  return captured;
}

function redeemOnce(code: string, signIn: SignIn): Promise<boolean> {
  redemption ??= (async () => {
    try {
      return (await signIn("agent-code", { code })).signingIn;
    } catch (err) {
      if (!isRefreshTokenParseError(err)) throw err;
      await clearAuthCookies();
      return (await signIn("agent-code", { code })).signingIn;
    }
  })();
  return redemption;
}

/**
 * Redeems the one-time code minted by `bun run agent:login-url`. The code only ever lives in the
 * URL fragment, which is never sent to a server.
 */
export function AgentLoginClient() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [status, setStatus] = useState("Signing in…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { code, nextPath } = captureFragment();
    if (isLoading) return;
    let active = true;
    const fail = (message: string) => {
      if (!active) return;
      setStatus(FAILED);
      setError(message);
    };

    if (!code) {
      if (isAuthenticated) router.replace(nextPath);
      else queueMicrotask(() => fail("Missing or malformed code. Mint a new URL with `bun run agent:login-url`."));
      return () => {
        active = false;
      };
    }

    redeemOnce(code, signIn).then(
      (signedIn) => {
        if (!active) return;
        if (!signedIn) {
          fail("Code rejected: it is invalid, expired or already used. Mint a new one.");
          return;
        }
        setStatus("Redirecting…");
        router.replace(nextPath);
      },
      (err: unknown) => {
        console.error(err);
        fail(err instanceof Error ? err.message : FAILED);
      },
    );
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, router, signIn]);

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
