"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { oneDark, oneLight } from "@/lib/syntax-highlight";

type PrismTheme = { [key: string]: React.CSSProperties };

export function useIsLightTheme(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "light";
}

export function useSyntaxStyle(): PrismTheme {
  return useIsLightTheme() ? oneLight : oneDark;
}
