"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useLocationSearchParams() {
  const pathname = usePathname();
  const [params, setParams] = useState(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    setParams(new URLSearchParams(window.location.search));
  }, []);

  const replaceParams = useCallback((next: URLSearchParams | string) => {
    setParams(typeof next === "string" ? new URLSearchParams(next) : new URLSearchParams(next.toString()));
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const onPopState = () => refresh();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [refresh]);

  return { params, refresh, replaceParams };
}
