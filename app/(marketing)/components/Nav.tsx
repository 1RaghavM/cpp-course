"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function Nav({ hideActions = false }: { hideActions?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => setScrolled(!(entries[0]?.isIntersecting ?? true)),
      {
        threshold: 0,
      },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>("a, button");
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    const firstFocusable = overlayRef.current?.querySelector<HTMLElement>("a, button");
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <div
        ref={sentinelRef}
        style={{ position: "absolute", top: 0, height: "1px", width: "100%" }}
        aria-hidden="true"
      />

      <header className="nav-header" data-scrolled={scrolled || undefined}>
        <nav className="nav-inner">
          <Link href="/" className="nav-wordmark">
            <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={192} height={48} priority style={{ height: "48px", width: "auto" }} />
          </Link>

          {!hideActions && (
            <>
              <div className="nav-actions">
                <Link href="/login" className="hp-btn hp-btn-secondary">
                  Sign in
                </Link>
                <Link href="/onboarding" className="hp-btn hp-btn-primary">
                  Start learning
                </Link>
              </div>

              <button
                ref={triggerRef}
                className="nav-mobile-trigger"
                onClick={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
            </>
          )}
        </nav>
      </header>

      {!hideActions && menuOpen && (
        <div
          ref={overlayRef}
          className="nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button className="nav-overlay-close" onClick={closeMenu} aria-label="Close menu">
            <CloseIcon />
          </button>
          <Link
            href="/login"
            className="hp-btn hp-btn-secondary hp-btn-lg"
            onClick={closeMenu}
            style={{ width: "200px" }}
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="hp-btn hp-btn-primary hp-btn-lg"
            onClick={closeMenu}
            style={{ width: "200px" }}
          >
            Start learning
          </Link>
        </div>
      )}
    </>
  );
}
