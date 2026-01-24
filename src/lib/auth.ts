"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export function useSignIn() {
  const authActions = useAuthActions();
  const signIn = authActions?.signIn;

  async function signInWithPassword(email: string, password: string, flow: "signIn" | "signUp") {
    if (!signIn) return;
    return signIn("password", { email, password, flow });
  }

  return { signInWithPassword };
}

export function useSignOut() {
  const authActions = useAuthActions();
  const signOut = authActions?.signOut || (async () => {});
  return { signOut };
}
