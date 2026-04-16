import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Update your profile, avatar, theme, and appearance preferences for UVSDECKS.GG.",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
