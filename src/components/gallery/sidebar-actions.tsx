"use client";

import { UserIcon } from "lucide-react";

export function UniversusGallerySidebarActions() {
  return [
    {
      id: "active-deck",
      label: "Active Deck",
      icon: <UserIcon className="h-4 w-4" />,
      content: <div>Active Deck</div>,
    },
  ];
}
