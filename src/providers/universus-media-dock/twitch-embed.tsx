"use client";

import { cn } from "@/lib/utils";

type TwitchStreamEmbedProps = {
  channel: string;
  title: string;
  className?: string;
};

export function TwitchStreamEmbed({ channel, title, className }: TwitchStreamEmbedProps) {
  const parent = typeof window !== "undefined" ? window.location.hostname : "";
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&muted=false`;
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-black", className)}>
      <iframe
        className="absolute inset-0 h-full w-full border-0"
        src={src}
        title={title}
        allow="fullscreen; autoplay; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
