"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

export type TeamHubPrimaryAction = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
};

type TeamHubPrimaryActionContextValue = {
  action: TeamHubPrimaryAction | null;
  setAction: (action: TeamHubPrimaryAction | null) => void;
};

const TeamHubPrimaryActionContext = createContext<TeamHubPrimaryActionContextValue | null>(null);

export function TeamHubPrimaryActionProvider({ children }: { children: ReactNode }) {
  const [action, setActionState] = useState<TeamHubPrimaryAction | null>(null);
  const setAction = useCallback((next: TeamHubPrimaryAction | null) => {
    setActionState(next);
  }, []);

  const value = useMemo(() => ({ action, setAction }), [action, setAction]);

  return (
    <TeamHubPrimaryActionContext.Provider value={value}>
      {children}
    </TeamHubPrimaryActionContext.Provider>
  );
}

export function useTeamHubPrimaryAction() {
  const context = useContext(TeamHubPrimaryActionContext);
  if (!context) {
    throw new Error("useTeamHubPrimaryAction must be used within TeamHubPrimaryActionProvider");
  }
  return context.action;
}

export function useRegisterTeamHubPrimaryAction(
  enabled: boolean,
  label: string,
  onClick: () => void,
  icon?: LucideIcon,
) {
  const context = useContext(TeamHubPrimaryActionContext);
  if (!context) {
    throw new Error("useRegisterTeamHubPrimaryAction must be used within TeamHubPrimaryActionProvider");
  }

  const { setAction } = context;

  useEffect(() => {
    if (!enabled) {
      setAction(null);
      return;
    }
    setAction({ label, onClick, icon });
    return () => setAction(null);
  }, [enabled, icon, label, onClick, setAction]);
}
