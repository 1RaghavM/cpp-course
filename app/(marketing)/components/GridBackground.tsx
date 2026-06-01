"use client";

import { useCallback, useEffect, useRef } from "react";

export function GridBackground() {
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--gx", `${e.clientX}px`);
    el.style.setProperty("--gy", `${e.clientY}px`);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEnter = () => el.classList.add("page-grid-active");
    const onLeave = () => el.classList.remove("page-grid-active");

    window.addEventListener("mousemove", update);
    document.documentElement.addEventListener("mouseenter", onEnter);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", update);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [update]);

  return <div className="page-grid" ref={ref} aria-hidden="true" />;
}
