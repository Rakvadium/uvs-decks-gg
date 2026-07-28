import type { Metadata } from "next";
import { AuthRouteEntry } from "@/components/auth/auth-route-entry";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <AuthRouteEntry
      flow="signIn"
      heading="Sign in to continue"
      description="Use your UVSDECKS.GG account to build decks, save collections, and join the community."
      actionLabel="Sign In"
    />
  );
}
