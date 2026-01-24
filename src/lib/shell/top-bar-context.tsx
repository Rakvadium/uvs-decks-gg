"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface TopBarContextValue {
  content: ReactNode;
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
}

const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode>(null);

  const setContent = useCallback((newContent: ReactNode) => {
    setContentState(newContent);
  }, []);

  const clearContent = useCallback(() => {
    setContentState(null);
  }, []);

  return (
    <TopBarContext.Provider value={{ content, setContent, clearContent }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  const context = useContext(TopBarContext);
  if (!context) {
    throw new Error("useTopBar must be used within a TopBarProvider");
  }
  return context;
}

export function useSetTopBarContent(content: ReactNode) {
  const { setContent, clearContent } = useTopBar();

  useEffect(() => {
    setContent(content);
    return () => clearContent();
  }, [content, setContent, clearContent]);
}

export function TopBarContent() {
  const { content } = useTopBar();
  return <>{content}</>;
}
