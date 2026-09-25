import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { getHostBrand } from "@shared/games/registry";
import { GameProvider } from "@/games/game-context";
import { getRequestGame } from "@/lib/routing/request-game";
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

export async function generateMetadata(): Promise<Metadata> {
  const { game, hostKind } = await getRequestGame();
  const brand = getHostBrand(hostKind, game);
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: brand.title,
      template: `%s | ${brand.title}`,
    },
    description: brand.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { game, hostKind, host, protocol } = await getRequestGame();
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
        <GameProvider game={game} hostKind={hostKind} host={host} protocol={protocol}>
          <Providers>{children}</Providers>
        </GameProvider>
      </body>
    </html>
    </ConvexAuthNextjsServerProvider>
  );
}
