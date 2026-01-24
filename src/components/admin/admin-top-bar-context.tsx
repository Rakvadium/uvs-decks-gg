"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";

interface AdminTopBarContextValue {
  topBarContent: ReactNode | null;
  setTopBarContent: (content: ReactNode | null) => void;
}

const AdminTopBarContext = createContext<AdminTopBarContextValue | null>(null);

export function AdminTopBarProvider({ children }: { children: ReactNode }) {
  const [topBarContent, setTopBarContentState] = useState<ReactNode | null>(null);

  const setTopBarContent = useCallback((content: ReactNode | null) => {
    setTopBarContentState(content);
  }, []);

  const value = useMemo(() => ({
    topBarContent,
    setTopBarContent,
  }), [topBarContent, setTopBarContent]);

  return (
    <AdminTopBarContext.Provider value={value}>
      {children}
    </AdminTopBarContext.Provider>
  );
}

export function useAdminTopBar() {
  const context = useContext(AdminTopBarContext);
  if (!context) {
    throw new Error("useAdminTopBar must be used within AdminTopBarProvider");
  }
  return context;
}

export function AdminTopBarContent() {
  const context = useContext(AdminTopBarContext);
  return <>{context?.topBarContent}</>;
}

