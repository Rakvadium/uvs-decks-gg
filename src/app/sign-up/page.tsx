import type { Metadata } from "next";
import { AuthRouteEntry } from "@/components/auth/auth-route-entry";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function SignUpPage() {
  return (
    <AuthRouteEntry
      flow="signUp"
      heading="Create your account"
      description="Join UVSDECKS.GG to build decks, save collections, and explore community tier lists."
      actionLabel="Create Account"
    />
  );
}
