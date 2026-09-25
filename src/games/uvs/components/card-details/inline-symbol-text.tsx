import Image from "next/image";
import { getSymbolPath } from "../symbol-icon";
import { cn } from "@/lib/utils";

const TOKEN_PATTERN = /\{([a-z0-9:_-]+)\}/gi;

export function InlineSymbolText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const full = match[0];
    const token = match[1];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    const path = getSymbolPath(token);
    if (path) {
      parts.push(
        <Image
          key={`${token}-${index}`}
          src={path}
          alt={full}
          width={18}
          height={18}
          className="mx-0.5 inline-block h-[1.15em] w-[1.15em] align-[-0.18em] object-contain"
        />
      );
    } else {
      parts.push(full);
    }
    lastIndex = index + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? <span className={cn(className)}>{parts}</span> : text}</>;
}
