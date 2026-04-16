import type { Metadata, Viewport } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "UVSDECKS.GG",
    template: "%s | UVSDECKS.GG",
  },
  description:
    "Build UniVersus decks, browse the card gallery, track your collection, and explore community tier lists on UVSDECKS.GG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
    </ConvexAuthNextjsServerProvider>
  );
}
