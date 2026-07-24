import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <Avatar className={cn("h-8 w-8 rounded-lg border-0 shadow-none", avatarClassName)}>
        {user?.image ? <AvatarImage src={user.image} alt={name} /> : null}
        <AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {showDetails ? (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{name}</span>
        </div>
      ) : null}
    </div>
  );
}
