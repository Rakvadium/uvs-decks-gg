import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · UI matrix",
  description:
    "Internal design-system reference for buttons, badges, and card variants on UVSDECKS.GG.",
};

export default function AdminUiMatrixLayout({ children }: { children: ReactNode }) {
  return children;
}
