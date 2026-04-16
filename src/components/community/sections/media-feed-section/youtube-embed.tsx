"use client";

import { cn } from "@/lib/utils";

type YoutubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function YoutubeEmbed({ videoId, title, className }: YoutubeEmbedProps) {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-black", className)}>
      <iframe
        className="absolute inset-0 h-full w-full border-0"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
