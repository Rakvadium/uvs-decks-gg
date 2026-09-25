import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Import",
  description:
    "Import or clear UniVersus card JSON data in bulk (admin only).",
};

export default function AdminImportLayout({ children }: { children: ReactNode }) {
  return children;
}
