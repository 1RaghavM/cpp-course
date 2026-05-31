# Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public marketing homepage at `/` with a dark Vercel/GitHub aesthetic, isolated from the existing app's design system.

**Architecture:** New `app/(marketing)/` route group with scoped CSS tokens, Geist fonts, and Shiki-highlighted code. Existing dashboard moves to `/dashboard`. Middleware updated to serve the public homepage to unauthenticated visitors and redirect authenticated users to `/dashboard`.

**Tech Stack:** Next.js 14 App Router, Tailwind 3, Geist Sans/Mono, Shiki (build-time syntax highlighting), CSS custom properties for token scoping.

**Spec:** `docs/superpowers/specs/2026-05-31-homepage-design.md`

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install geist and shiki**

```bash
npm install geist shiki
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('geist/font/sans'); require('shiki'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add geist and shiki dependencies for homepage"
```

---

### Task 2: Move dashboard to /dashboard

**Files:**
- Create: `app/(app)/dashboard/page.tsx` (contents from `app/(app)/page.tsx`)
- Delete: `app/(app)/page.tsx`
- Modify: `components/layout/AppHeader.tsx:8` — change `href="/"` → `href="/dashboard"`
- Modify: `app/(app)/lessons/[slug]/LessonClient.tsx:522` — change `href="/"` → `href="/dashboard"`

- [ ] **Step 1: Create dashboard directory and move the page**

```bash
mkdir -p app/\(app\)/dashboard
mv app/\(app\)/page.tsx app/\(app\)/dashboard/page.tsx
```

- [ ] **Step 2: Update AppHeader link**

In `components/layout/AppHeader.tsx`, line 8, change:

```tsx
<Link href="/" className="flex items-center gap-1">
```

to:

```tsx
<Link href="/dashboard" className="flex items-center gap-1">
```

- [ ] **Step 3: Update LessonClient link**

In `app/(app)/lessons/[slug]/LessonClient.tsx`, line 522, change:

```tsx
href="/"
```

to:

```tsx
href="/dashboard"
```

- [ ] **Step 4: Verify no remaining `/` links in the app**

```bash
grep -rn 'href="/"' app/ components/ --include="*.tsx" --include="*.ts"
```

Expected: no results.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx components/layout/AppHeader.tsx app/\(app\)/lessons/\[slug\]/LessonClient.tsx
git add -u app/\(app\)/page.tsx
git commit -m "refactor: move dashboard route from / to /dashboard"
```

---

### Task 3: Update middleware

**Files:**
- Modify: `middleware.ts`

The current middleware redirects unauthenticated users to `/login` for all non-auth routes. We need:
- `/` unauthenticated → pass through (render marketing homepage)
- `/` authenticated → redirect to `/dashboard`
- All other non-auth routes → existing behavior unchanged

- [ ] **Step 1: Update middleware logic**

Replace the contents of `middleware.ts` with:

```typescript
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRoute } from "@/lib/auth/constants";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  if (pathname === "/auth/callback") {
    return res;
  }

  if (pathname === "/") {
    if (session) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
    return res;
  }

  if (isAuthRoute(pathname)) {
    if (session) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
    return res;
  }

  if (pathname === "/update-password") {
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Key changes from the original:
- New block for `pathname === "/"`: authenticated → `/dashboard`, unauthenticated → pass through
- Auth route redirect target changed from `/` to `/dashboard`

- [ ] **Step 2: Verify the dev server starts**

```bash
npm run dev
```

Open `http://localhost:3000` in a private/incognito window — should not redirect to `/login` (will show a 404 or blank page until we add the marketing page, which is expected).

Open `http://localhost:3000` while logged in — should redirect to `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: make / public for homepage, redirect authed users to /dashboard"
```

---

### Task 4: Create design tokens and marketing layout

**Files:**
- Create: `app/(marketing)/homepage.css`
- Create: `app/(marketing)/layout.tsx`

- [ ] **Step 1: Create the homepage CSS tokens file**

Create `app/(marketing)/homepage.css`:

```css
/* Design tokens scoped to the marketing homepage */
[data-page="homepage"] {
  /* Surfaces */
  --color-bg: #0a0a0a;
  --color-surface: #0f1115;
  --color-surface-2: #161b22;
  --color-elevated: #1c2128;

  /* Borders */
  --color-border: #23262d;
  --color-border-strong: #30363d;

  /* Foreground */
  --color-fg: #ededed;
  --color-fg-muted: #8b949e;
  --color-fg-subtle: #6e7681;

  /* Accent */
  --color-accent: #2f81f7;
  --color-link: #58a6ff;
  --color-accent-fg: #ffffff;

  /* Glow */
  --color-glow: rgba(47, 129, 247, 0.18);

  /* Syntax highlighting */
  --code-bg: #0f1115;
  --code-plain: #e6edf3;
  --code-comment: #8b949e;
  --code-keyword: #ff7b72;
  --code-string: #a5d6ff;
  --code-func: #d2a8ff;
  --code-number: #79c0ff;
  --code-variable: #ffa657;

  /* Typography */
  --hp-font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --hp-font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo,
    monospace;
  --text-hero: clamp(2.75rem, 6vw, 4.5rem);
  --text-h2: clamp(1.75rem, 3vw, 2.25rem);
  --text-h3: 1.25rem;
  --text-body: 1.0625rem;
  --text-sm: 0.875rem;
  --text-eyebrow: 0.8125rem;

  /* Spacing & layout */
  --container-max: 1100px;
  --container-pad: 24px;
  --section-y: clamp(80px, 12vw, 160px);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --hairline: 1px solid var(--color-border);

  /* Base styles */
  font-family: var(--hp-font-sans);
  background-color: var(--color-bg);
  color: var(--color-fg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (max-width: 640px) {
  [data-page="homepage"] {
    --container-pad: 16px;
  }
}

/* --- Container --- */

.hp-container {
  max-width: var(--container-max);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-pad);
  padding-right: var(--container-pad);
}

/* --- Sections --- */

.hp-section {
  padding-top: var(--section-y);
  padding-bottom: var(--section-y);
}

.hp-section-border {
  border-top: var(--hairline);
}

/* --- Buttons --- */

.hp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 20px;
  border-radius: var(--radius-md);
  font-family: var(--hp-font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  transition: background-color 150ms ease, border-color 150ms ease;
  cursor: pointer;
}

.hp-btn-lg {
  height: 44px;
}

.hp-btn-primary {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #ffffff;
}

.hp-btn-primary:hover {
  background-color: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.92);
}

.hp-btn-secondary {
  background-color: transparent;
  color: var(--color-fg);
  border: 1px solid var(--color-border-strong);
}

.hp-btn-secondary:hover {
  border-color: var(--color-fg-subtle);
  background-color: var(--color-surface-2);
}

/* --- Focus ring --- */

.hp-btn:focus-visible,
[data-page="homepage"] a:focus-visible,
[data-page="homepage"] button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* --- Nav --- */

.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 64px;
  transition: background-color 200ms ease, border-color 200ms ease;
  border-bottom: 1px solid transparent;
}

.nav-header[data-scrolled] {
  background-color: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom-color: var(--color-border);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--container-pad);
}

.nav-wordmark {
  font-family: var(--hp-font-mono);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-fg);
  text-decoration: none;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-mobile-trigger {
  display: none;
  background: none;
  border: none;
  color: var(--color-fg);
  padding: 8px;
  cursor: pointer;
}

@media (max-width: 767px) {
  .nav-actions {
    display: none;
  }

  .nav-mobile-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* --- Mobile overlay --- */

.nav-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
}

.nav-overlay-close {
  position: absolute;
  top: 16px;
  right: var(--container-pad);
  background: none;
  border: none;
  color: var(--color-fg);
  padding: 8px;
  cursor: pointer;
}

/* --- Code card --- */

.code-card {
  border: var(--hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-surface);
}

.code-card-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: var(--hairline);
}

.code-card-tab {
  font-family: var(--hp-font-mono);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.code-card-body {
  padding: 20px 24px;
  overflow-x: auto;
}

.code-card-body pre {
  margin: 0;
  background: transparent !important;
  font-family: var(--hp-font-mono);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.code-card-body code {
  font-family: inherit;
}

/* --- Feature cards --- */

.feature-card {
  background-color: var(--color-surface);
  border: var(--hairline);
  border-radius: var(--radius-md);
  padding: 28px;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.feature-card:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-surface-2);
}

/* --- Curriculum tabs --- */

.tab-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 48px;
}

.tab-button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 0;
  font-family: var(--hp-font-sans);
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}

.tab-button:hover {
  color: var(--color-fg);
}

.tab-button[data-active] {
  color: var(--color-fg);
  border-bottom-color: var(--color-accent);
}

@media (max-width: 640px) {
  .tab-bar {
    gap: 20px;
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 1px;
    -webkit-overflow-scrolling: touch;
  }

  .tab-button {
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* --- Reveal animation --- */

.hp-reveal {
  opacity: 0;
  transform: translateY(8px);
  animation: hp-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.hp-reveal-d1 { animation-delay: 60ms; }
.hp-reveal-d2 { animation-delay: 120ms; }
.hp-reveal-d3 { animation-delay: 180ms; }
.hp-reveal-d4 { animation-delay: 240ms; }
.hp-reveal-d5 { animation-delay: 300ms; }

@keyframes hp-fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hp-reveal {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

- [ ] **Step 2: Create the marketing layout**

Create `app/(marketing)/layout.tsx`:

```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./homepage.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-page="homepage"
      className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify the layout renders**

```bash
npm run dev
```

Visit `http://localhost:3000` in an incognito window. Should see a blank near-black page (no content yet, but no errors). Check the browser DevTools: the `[data-page="homepage"]` element should have the CSS variables defined.

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/homepage.css app/\(marketing\)/layout.tsx
git commit -m "feat: add homepage design tokens and marketing layout"
```

---

### Task 5: Create Footer and FinalCTA components

**Files:**
- Create: `app/(marketing)/components/Footer.tsx`
- Create: `app/(marketing)/components/FinalCTA.tsx`

These are the simplest components — pure server-rendered, no interactivity.

- [ ] **Step 1: Create Footer**

Create `app/(marketing)/components/Footer.tsx`:

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ borderTop: "var(--hairline)" }}>
      <div className="hp-container" style={{ padding: "20px var(--container-pad)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "var(--text-sm)",
            color: "var(--color-fg-subtle)",
          }}
        >
          <span style={{ fontFamily: "var(--hp-font-mono)", fontWeight: 600 }}>
            cpproad
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/login"
              style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}
            >
              Sign in
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Create FinalCTA**

Create `app/(marketing)/components/FinalCTA.tsx`:

```tsx
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="hp-section hp-section-border">
      <div
        className="hp-container"
        style={{ textAlign: "center", maxWidth: "600px" }}
      >
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            marginBottom: "32px",
          }}
        >
          Start with the basics. No setup required.
        </h2>
        <Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
          Start learning C++
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/components/Footer.tsx app/\(marketing\)/components/FinalCTA.tsx
git commit -m "feat: add Footer and FinalCTA homepage components"
```

---

### Task 6: Create CodeCard component

**Files:**
- Create: `app/(marketing)/components/CodeCard.tsx`

This is a server component that uses Shiki to highlight C++ at build time.

- [ ] **Step 1: Create CodeCard**

Create `app/(marketing)/components/CodeCard.tsx`:

```tsx
import { codeToHtml } from "shiki";

const HERO_CODE = `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\\n";
    }

    return 0;
}`;

export async function CodeCard() {
  const html = await codeToHtml(HERO_CODE, {
    lang: "cpp",
    theme: "github-dark",
  });

  return (
    <div className="code-card">
      <div className="code-card-header">
        <span className="code-card-tab">main.cpp</span>
      </div>
      <div className="code-card-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
```

- [ ] **Step 2: Quick smoke test**

Temporarily add to a test page or verify Shiki runs without errors:

```bash
node -e "
const { codeToHtml } = require('shiki');
codeToHtml('#include <iostream>', { lang: 'cpp', theme: 'github-dark' })
  .then(html => { console.log(html.substring(0, 100)); console.log('OK'); })
  .catch(err => { console.error(err); process.exit(1); });
"
```

Expected: HTML output containing syntax-highlighted spans, ending with `OK`.

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/components/CodeCard.tsx
git commit -m "feat: add Shiki-highlighted CodeCard component"
```

---

### Task 7: Create Hero component

**Files:**
- Create: `app/(marketing)/components/Hero.tsx`

Server component that composes the glow background, headline, CTAs, and CodeCard.

- [ ] **Step 1: Create Hero**

Create `app/(marketing)/components/Hero.tsx`:

```tsx
import Link from "next/link";
import { CodeCard } from "./CodeCard";

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "calc(64px + clamp(60px, 10vw, 120px))",
        paddingBottom: "var(--section-y)",
      }}
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-glow), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="hp-container"
        style={{ position: "relative", maxWidth: "820px" }}
      >
        {/* Headline */}
        <h1
          className="hp-reveal"
          style={{
            fontSize: "var(--text-hero)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "var(--color-fg)",
            textAlign: "center",
            margin: 0,
          }}
        >
          Learn C++ the way it&rsquo;s actually written.
        </h1>

        {/* Sub-line */}
        <p
          className="hp-reveal hp-reveal-d1"
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.6,
            color: "var(--color-fg-muted)",
            textAlign: "center",
            maxWidth: "580px",
            margin: "24px auto 0",
          }}
        >
          A structured, hands-on path through modern C++ — from first program to
          templates. Write real code in a sandboxed editor, get help from an AI
          tutor when you&rsquo;re stuck.
        </p>

        {/* CTAs */}
        <div
          className="hp-reveal hp-reveal-d2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
            Start learning C++
          </Link>
          <Link href="/login" className="hp-btn hp-btn-secondary hp-btn-lg">
            Sign in
          </Link>
        </div>

        {/* Code card */}
        <div className="hp-reveal hp-reveal-d3" style={{ marginTop: "56px" }}>
          <CodeCard />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/components/Hero.tsx
git commit -m "feat: add Hero section with glow, CTAs, and code card"
```

---

### Task 8: Create Features component

**Files:**
- Create: `app/(marketing)/components/Features.tsx`

Server component with 4 topic cards in a responsive grid.

- [ ] **Step 1: Create Features**

Create `app/(marketing)/components/Features.tsx`:

```tsx
const FEATURES = [
  {
    title: "Pointers & memory",
    description:
      "Pointers stop being scary once you can see what they point at.",
    code: "int* ptr = &x;",
  },
  {
    title: "The STL in practice",
    description:
      "Vectors, maps, algorithms — learn the standard library by using it.",
    code: "std::vector<int>",
  },
  {
    title: "Templates & generics",
    description:
      "Write code that works with any type, without the mystery.",
    code: "template<typename T>",
  },
  {
    title: "Compile, link, debug",
    description:
      "Understand what happens between 'Save' and 'Run'.",
    code: "g++ -std=c++17",
  },
] as const;

export function Features() {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container">
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            textAlign: "center",
            marginBottom: "56px",
          }}
        >
          What you&rsquo;ll actually learn
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
          }}
          className="features-grid"
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <h3
                style={{
                  fontSize: "var(--text-h3)",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: "var(--color-fg)",
                  margin: "0 0 8px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-body)",
                  lineHeight: 1.6,
                  color: "var(--color-fg-muted)",
                  margin: "0 0 16px",
                }}
              >
                {feature.description}
              </p>
              <code
                style={{
                  fontFamily: "var(--hp-font-mono)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-fg-subtle)",
                }}
              >
                {feature.code}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the responsive grid rule to homepage.css**

Append to `app/(marketing)/homepage.css`:

```css
/* --- Features grid responsive --- */

@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/components/Features.tsx app/\(marketing\)/homepage.css
git commit -m "feat: add Features section with topic cards"
```

---

### Task 9: Create CurriculumTabs component

**Files:**
- Create: `app/(marketing)/components/CurriculumTabs.tsx`

Client component with 4 tabs and static topic lists.

- [ ] **Step 1: Create CurriculumTabs**

Create `app/(marketing)/components/CurriculumTabs.tsx`:

```tsx
"use client";

import { useState } from "react";

const STAGES = [
  {
    label: "Basics",
    topics: [
      "Variables & types",
      "Control flow",
      "Functions",
      "Arrays & strings",
      "I/O streams",
      "Operators & expressions",
    ],
  },
  {
    label: "Memory & OOP",
    topics: [
      "Pointers & references",
      "Dynamic allocation",
      "Classes & objects",
      "Inheritance",
      "Operator overloading",
      "Scope & namespaces",
    ],
  },
  {
    label: "STL & Templates",
    topics: [
      "std::vector & std::array",
      "Iterators",
      "Algorithms",
      "Function & class templates",
      "Smart pointers",
      "Containers & adaptors",
    ],
  },
  {
    label: "Advanced",
    topics: [
      "Move semantics",
      "Exceptions",
      "Lambda expressions",
      "The preprocessor",
      "Input & output streams",
      "Build systems & linking",
    ],
  },
] as const;

export function CurriculumTabs() {
  const [active, setActive] = useState(0);

  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ maxWidth: "720px" }}>
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          A clear path from basics to proficiency
        </h2>

        {/* Tab bar */}
        <div className="tab-bar" role="tablist">
          {STAGES.map((stage, i) => (
            <button
              key={stage.label}
              className="tab-button"
              role="tab"
              aria-selected={i === active}
              data-active={i === active ? "" : undefined}
              onClick={() => setActive(i)}
            >
              {stage.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div role="tabpanel">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {STAGES[active].topics.map((topic) => (
              <li
                key={topic}
                style={{
                  fontSize: "var(--text-body)",
                  lineHeight: 1.6,
                  color: "var(--color-fg-muted)",
                  paddingLeft: "16px",
                  borderLeft: "2px solid var(--color-border)",
                }}
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/components/CurriculumTabs.tsx
git commit -m "feat: add CurriculumTabs section with 4-stage topic tabs"
```

---

### Task 10: Create Nav component

**Files:**
- Create: `app/(marketing)/components/Nav.tsx`

Client component — the most complex piece. Handles scroll-based background, mobile menu with focus trapping, and keyboard interaction.

- [ ] **Step 1: Create Nav**

Create `app/(marketing)/components/Nav.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
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
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          "a, button",
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

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

    const firstFocusable = overlayRef.current?.querySelector<HTMLElement>(
      "a, button",
    );
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

      <header
        className="nav-header"
        data-scrolled={scrolled || undefined}
      >
        <nav className="nav-inner">
          <Link href="/" className="nav-wordmark">
            cpproad
          </Link>

          <div className="nav-actions">
            <Link href="/login" className="hp-btn hp-btn-secondary">
              Sign in
            </Link>
            <Link href="/register" className="hp-btn hp-btn-primary">
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
        </nav>
      </header>

      {menuOpen && (
        <div
          ref={overlayRef}
          className="nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            className="nav-overlay-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
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
            href="/register"
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/components/Nav.tsx
git commit -m "feat: add sticky Nav with scroll state and mobile menu"
```

---

### Task 11: Assemble the page

**Files:**
- Create: `app/(marketing)/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/(marketing)/page.tsx`:

```tsx
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { CurriculumTabs } from "./components/CurriculumTabs";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <CurriculumTabs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify the full page renders**

```bash
npm run dev
```

Open `http://localhost:3000` in an incognito window. All six sections should render: Nav → Hero (with syntax-highlighted code card) → Features (4 cards) → Curriculum (4 tabs) → Final CTA → Footer.

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/page.tsx
git commit -m "feat: assemble homepage from all sections"
```

---

### Task 12: Visual QA and quality gate

**Files:** none (inspection only, may result in small tweaks)

Run through the quality checklist from the spec. This task is manual browser inspection.

- [ ] **Step 1: Build and lint**

```bash
npm run build && npm run lint
```

Both must pass with no errors.

- [ ] **Step 2: Responsive check**

Open the dev server. In browser DevTools, test at these widths:
- 320px — CTAs stack, feature cards single column, no horizontal scroll
- 768px — mobile menu breakpoint boundary
- 1280px — desktop layout
- 1920px — no stretching beyond container-max

- [ ] **Step 3: Anti-slop checklist**

Verify each item from `QUALITY.md`:
- [ ] Canvas is near-black `#0a0a0a`, body text is `#ededed` (not pure white)
- [ ] Exactly one accent color (blue), used sparingly
- [ ] Structure uses hairlines and surface steps, not shadows
- [ ] Geist Sans/Mono fonts are rendering (check DevTools computed styles)
- [ ] Hero code is real, correct, idiomatic C++
- [ ] One subtle glow (hero only)
- [ ] No social proof anywhere
- [ ] No filler links in footer
- [ ] No purple gradients, no glassmorphism, no generic icon trio
- [ ] No emoji used as section icons

- [ ] **Step 4: Accessibility check**

- Tab through entire page: all interactive elements reachable, visible focus ring
- Open mobile menu: focus trapped, `Esc` closes, focus returns to hamburger
- Check heading order: one `h1` (hero), `h2` per section, logical order
- Check landmarks: `header`, `main`, `footer` present
- Glow div has `aria-hidden="true"`

- [ ] **Step 5: Interaction check**

- Scroll down: nav transitions from transparent to blurred dark background
- Hover feature cards: border and bg shift subtly
- Click curriculum tabs: panels swap
- Page load: hero elements fade up with stagger
- `prefers-reduced-motion`: animations disabled (toggle in DevTools → Rendering)

- [ ] **Step 6: Auth routing check**

- Incognito window → `http://localhost:3000` → see homepage
- Log in → visit `http://localhost:3000` → redirect to `/dashboard`
- Auth pages (`/login`, `/register`) → still work normally

- [ ] **Step 7: Fix any issues found, commit**

If any issues are found during QA, fix them and commit:

```bash
git add -A
git commit -m "fix: homepage visual QA adjustments"
```

- [ ] **Step 8: Final build verification**

```bash
npm run build
```

Must complete with no errors. The homepage route should appear in the build output as a static page.
