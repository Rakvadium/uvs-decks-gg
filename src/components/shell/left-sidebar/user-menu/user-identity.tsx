import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../context";

interface LeftSidebarUserIdentityProps {
  className?: string;
  avatarClassName?: string;
  showDetails?: boolean;
}

export function LeftSidebarUserIdentity({
  className,
  avatarClassName,
  showDetails = true,
}: LeftSidebarUserIdentityProps) {
  const { user } = useLeftSidebarContext();
  const name = user?.username || "User";

  return (
    <div className={cn("flex items-center gap-2 text-left text-sm", className)}>
      <UserAvatar
        username={user?.username}
        image={user?.image}
        alt={name}
        className={cn("h-8 w-8 rounded-lg border-0 shadow-none", avatarClassName)}
        fallbackClassName="rounded-lg"
      />
      {showDetails ? (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{name}</span>
        </div>
      ) : null}
    </div>
  );
}
