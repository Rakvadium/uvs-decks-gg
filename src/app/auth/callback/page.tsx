import type { Metadata } from "next";
import { CallbackClient } from "./callback-client";

export const metadata: Metadata = {
  title: "Signing in",
  // The URL carries a one-time code until the client strips it; never leak it via Referer.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
