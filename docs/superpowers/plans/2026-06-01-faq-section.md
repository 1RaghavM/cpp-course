# FAQ Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accordion-style FAQ section to the marketing homepage, positioned between CurriculumTabs and FinalCTA.

**Architecture:** Single `'use client'` component (`FAQ.tsx`) with inline styles referencing existing CSS custom properties. Single-open accordion using `useState`. CSS grid-rows trick for smooth expand/collapse animation. No new CSS files or Tailwind — matches the pattern used by all other marketing components.

**Tech Stack:** React 18, Next.js App Router, Motion (for Reveal wrapper), CSS custom properties from `homepage.css`

**Spec:** `docs/superpowers/specs/2026-06-01-faq-section-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `app/(marketing)/components/FAQ.tsx` | FAQ section component: data, header, accordion items, state |
| Modify | `app/(marketing)/page.tsx` | Import FAQ and place between CurriculumTabs and FinalCTA |

---

### Task 1: Create the FAQ component with data and static header

**Files:**
- Create: `app/(marketing)/components/FAQ.tsx`

- [ ] **Step 1: Create FAQ.tsx with data array and header rendering**

```tsx
"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

const faqItems = [
  {
    q: "Do I need to install a compiler or set anything up?",
    a: "No. cpproad runs in your browser. There's a built-in editor where you write and run real C++ without installing a compiler, IDE, or anything else — you hit Run and see the output right there. The point is to get you writing code in your first few minutes instead of losing a weekend to setup.",
  },
  {
    q: "I've never written a line of code. Is C++ too hard to start with?",
    a: "C++ has a reputation for being unforgiving, and that's fair — but cpproad is built for starting from zero. It begins with the absolute basics and only introduces the intimidating stuff (pointers, memory, templates) once the foundation is there. You won't get dropped in the deep end, and when something doesn't click, the AI tutor is right there to explain it another way.",
  },
  {
    q: "What's the AI tutor, and how is it different from just asking ChatGPT?",
    a: "The tutor lives inside the lesson and the editor, so it already knows what you're working on and what you've covered. Instead of pasting code into a separate chat and re-explaining everything, you ask in place and it helps with that exact problem. It's there to unstick you and explain concepts — not to hand you the answer so you skip the learning.",
  },
  {
    q: "Do I actually write code, or is it just videos and quizzes?",
    a: "You write code. Every concept is something you immediately type, run, and watch work (or break) in the sandbox. cpproad is built around doing rather than watching, because reading about pointers and actually using them are two very different things.",
  },
  {
    q: "How is this different from free stuff like YouTube or learncpp.com?",
    a: "Those are great references, but they leave you to figure out the order, the setup, and whether you actually understood anything. cpproad is one structured path — write code, run it, get unstuck by the tutor, move on — all in one place with nothing to assemble yourself. You're paying for the path and the practice loop, not for the existence of C++ information.",
  },
  {
    q: "What does the roadmap actually cover?",
    a: "It takes you from the very basics — your first program, variables, control flow — through functions and the core language, and up into more advanced territory like templates. Each section builds on the last so there are no gaps, and by the end you're comfortable with the parts of C++ that real code actually uses.",
  },
  {
    q: "How soon can I write a real program?",
    a: "You write and run real code from the first lesson, so basically right away. Getting comfortable across the whole path is self-paced and depends on the time you put in, but there's no \"watch 10 hours before you touch code\" phase — you're building from day one.",
  },
  {
    q: "What if I get stuck and there's no one to ask?",
    a: "That's exactly what the AI tutor is for. When a concept won't click or your code won't compile, you ask right inside the editor and get an explanation aimed at where you actually are. You're never stuck staring at an error with nowhere to turn.",
  },
];

function FAQItem({
  item,
  index,
  open,
  onToggle,
}: {
  item: { q: string; a: string };
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "var(--hairline)",
        borderRadius: "var(--radius-lg)",
        transition: "background-color 150ms ease",
        ...(open ? {} : {}),
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface)";
      }}
    >
      <button
        id={`faq-q-${index}`}
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "22px 28px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--color-fg)",
          fontFamily: "var(--hp-font-sans)",
          fontSize: "var(--text-body)",
          fontWeight: 500,
          lineHeight: 1.4,
          gap: "16px",
        }}
      >
        <span>{item.q}</span>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontSize: "1.25rem",
            lineHeight: 1,
            color: "var(--color-fg-subtle)",
            transition: "transform 200ms ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>
      <div
        id={`faq-panel-${index}`}
        role="region"
        aria-labelledby={`faq-q-${index}`}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 250ms ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p
            style={{
              padding: "0 28px 22px",
              margin: 0,
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--color-fg-muted)",
            }}
          >
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ maxWidth: "770px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "var(--color-fg)",
                margin: 0,
              }}
            >
              FAQ
            </h2>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--color-fg-muted)",
                margin: "12px 0 0",
              }}
            >
              Find answers to common questions
              <br />
              about the roadmap, pricing, and access.
            </p>
          </div>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqItems.map((item, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <FAQItem
                item={item}
                index={i}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the file was created**

Run: `ls -la app/\(marketing\)/components/FAQ.tsx`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/components/FAQ.tsx
git commit -m "feat: add FAQ accordion component for homepage"
```

---

### Task 2: Wire FAQ into the homepage

**Files:**
- Modify: `app/(marketing)/page.tsx`

- [ ] **Step 1: Add FAQ import and place between CurriculumTabs and FinalCTA**

The current `page.tsx` looks like this:

```tsx
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { BentoGrid } from "./components/BentoGrid";
import { CurriculumTabs } from "./components/CurriculumTabs";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { GridBackground } from "./components/GridBackground";

export default function HomePage() {
  return (
    <>
      <GridBackground />
      <Nav />
      <main>
        <Hero />
        <BentoGrid />
        <CurriculumTabs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
```

Add the import after the CurriculumTabs import:

```tsx
import { FAQ } from "./components/FAQ";
```

Add `<FAQ />` between `<CurriculumTabs />` and `<FinalCTA />`:

```tsx
<CurriculumTabs />
<FAQ />
<FinalCTA />
```

- [ ] **Step 2: Run the dev server and verify the page loads**

Run: `npm run dev`
Open: `http://localhost:3000`
Expected: Homepage loads. Scroll down past CurriculumTabs — FAQ section appears with heading, subtitle, and 8 accordion cards. FinalCTA and Footer follow below.

- [ ] **Step 3: Test accordion behavior**

- Click a question — it expands smoothly, `+` rotates to `×`
- Click the same question — it collapses
- Click a different question — the first closes, the new one opens (single-open)
- Hover a card — background lightens
- Tab through cards — focus ring appears on each button
- Verify on mobile width (~375px) — section is readable, padding holds

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/page.tsx
git commit -m "feat: add FAQ section to homepage between CurriculumTabs and FinalCTA"
```

---

### Task 3: Type check and lint

- [ ] **Step 1: Run the TypeScript compiler**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`
Expected: No errors related to FAQ.tsx or page.tsx

- [ ] **Step 3: Run Prettier check**

Run: `npx prettier --check "app/(marketing)/components/FAQ.tsx" "app/(marketing)/page.tsx"`
Expected: All files formatted. If not, run `npx prettier --write` on them and amend the previous commit.
