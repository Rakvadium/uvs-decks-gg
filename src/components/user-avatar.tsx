"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  avatarInitialFromUsername,
  normalizeAvatarImagePath,
} from "@/lib/user-avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username?: string | null;
  image?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
}

export function UserAvatar({
  username,
  image,
  alt,
  className,
  fallbackClassName,
  imageClassName,
}: UserAvatarProps) {
  const imageSrc = normalizeAvatarImagePath(image);
  const initial = avatarInitialFromUsername(username);
  const label = alt ?? username?.trim() ?? "User";

  return (
    <Avatar key={imageSrc || "fallback"} className={className}>
      {imageSrc ? (
        <AvatarImage
          src={imageSrc}
          alt={label}
          className={cn("object-contain", imageClassName)}
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  );
}
