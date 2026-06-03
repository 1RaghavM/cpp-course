"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const trickleRef = useRef<ReturnType<typeof setInterval>>();

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (trickleRef.current) clearInterval(trickleRef.current);
  }, []);

  // Start navigation: animate bar toward 80%
  const start = useCallback(() => {
    cleanup();
    setProgress(0);
    setVisible(true);
    setIsNavigating(true);

    // Kick to 15% immediately, then trickle toward 80%
    requestAnimationFrame(() => setProgress(15));
    trickleRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) return prev;
        const step = (80 - prev) * 0.08;
        return Math.min(prev + step, 80);
      });
    }, 200);
  }, [cleanup]);

  // Complete navigation: snap to 100% then fade out
  const complete = useCallback(() => {
    cleanup();
    setProgress(100);
    setIsNavigating(false);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [cleanup]);

  // Detect internal link clicks to start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:"))
        return;

      // Skip if modifier keys are held (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Skip if target is set to something other than default
      if (anchor.target && anchor.target !== "_self") return;
      // Skip if it's the current page
      if (href === pathname) return;

      start();
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname, start]);

  // When pathname changes, navigation is complete
  useEffect(() => {
    if (isNavigating) {
      complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px]"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)] motion-reduce:transition-none"
        style={{
          width: `${progress}%`,
          transition:
            progress === 0
              ? "none"
              : progress === 100
                ? "width 150ms ease-out"
                : "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: progress === 100 ? "width, opacity" : "width",
          transitionDuration: progress === 100 ? "150ms, 200ms" : undefined,
          transitionDelay: progress === 100 ? "0ms, 150ms" : undefined,
        }}
      />
    </div>
  );
}
