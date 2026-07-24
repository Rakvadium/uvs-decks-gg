import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
    "Build UniVersus decks, browse the card gallery, and explore community tier lists on UVSDECKS.GG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
    <html
      lang="en"
      suppressHydrationWarning
      data-color-theme="default"
      data-chrome="calm"
      className={outfit.variable}
    >
      <body className={`${outfit.className} subpixel-antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
    </ConvexAuthNextjsServerProvider>
  );
}
