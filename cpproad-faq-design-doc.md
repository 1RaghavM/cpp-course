# cpproad — FAQ Section Design Doc

A spec for building the homepage FAQ section. The visual target is a dark, centered, accordion-style FAQ matching the reference screenshot (rounded "glossy" charcoal cards on a black background, a `+` toggle on the right that opens a smooth slide-down answer).

This doc is self-contained: design tokens, component structure, interaction behavior, accessibility, responsive rules, and the actual FAQ copy are all here.

---

## 1. Scope

Build a single `FAQ` section component for the homepage. It renders:

- A centered heading ("FAQ") and a two-line muted subtitle.
- A vertical stack of accordion items. Each item shows a question; clicking it expands a panel with the answer and swaps the `+` icon for a `×` (or `−`).
- Only behavior assumption: multiple items **can** be open at once is fine, but default to **single-open** (opening one closes the others) — it reads cleaner. Make this a prop so it's easy to flip.

Assumed stack: Next.js (App Router) + React + Tailwind CSS + **shadcn/ui**, since the site is on Vercel. The accordion uses shadcn's `Accordion` component (Radix UI under the hood) — see §4.

---

## 2. Layout

```
[ black full-bleed section, generous vertical padding ]
        FAQ                         <- centered, large, light weight
   Find answers to common           <- centered, muted, two lines
   questions about ...

   [ accordion card ]               <- max-width container, centered
   [ accordion card ]
   [ accordion card ]
   ...
```

- Section: full width, background pure black. Vertical padding ~96px top/bottom on desktop, ~64px on mobile.
- Inner container: `max-width: 770px`, centered (`margin: 0 auto`), horizontal padding 16px so cards don't touch the screen edge on mobile.
- Heading-to-subtitle gap ~12px. Subtitle-to-first-card gap ~48px.
- Gap between cards: 16px.

---

## 3. Design tokens

Reverse-engineered from the screenshot. Tune to match the live site's exact palette if it differs.

```css
/* Color */
--faq-bg:            #000000;   /* page / section background */
--faq-card:          #161616;   /* card base (slightly lifted off black) */
--faq-card-hover:    #1f1f1f;   /* card on hover */
--faq-card-top:      #2a2a2a;   /* lighter top edge for the glossy/raised look */
--faq-border:        rgba(255,255,255,0.06); /* hairline border */
--faq-text:          #f5f5f5;   /* question text + heading */
--faq-muted:         #8a8a8a;   /* subtitle + answer body */
--faq-icon:          #b0b0b0;   /* + / x icon */

/* Radius & spacing */
--faq-radius:        18px;
--faq-card-pad-x:    28px;
--faq-card-pad-y:    22px;
--faq-gap:           16px;

/* Type */
--faq-title-size:    64px;   /* "FAQ"  (mobile: 44px) */
--faq-title-weight:  300;    /* light — matches the thin look in the ref */
--faq-sub-size:      18px;
--faq-q-size:        17px;
--faq-q-weight:      500;
--faq-a-size:        16px;
--faq-a-line:        1.6;
```

The cards in the reference have a subtle "raised glass" quality. Reproduce it with a faint top-to-bottom gradient plus a 1px translucent border:

```css
background: linear-gradient(180deg, var(--faq-card-top) 0%, var(--faq-card) 40%);
border: 1px solid var(--faq-border);
```

Keep it subtle — it should read as a soft sheen on the top edge, not an obvious gradient.

---

## 4. Component structure — shadcn Accordion

Use the **shadcn/ui `Accordion`** component (`npx shadcn@latest add accordion`). It provides accessible expand/collapse with `aria-expanded`, `aria-controls`, keyboard navigation, and smooth height animation out of the box — no custom state management needed.

```
FAQ
 ├─ FAQHeader           (h2 "FAQ" + subtitle paragraph)
 └─ Accordion            (shadcn — type="single" for single-open, collapsible)
     └─ AccordionItem  (×N)
         ├─ AccordionTrigger   (the question row: text + chevron/icon)
         └─ AccordionContent   (the answer panel, animated)
```

Suggested React shape:

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function FAQ({ items, singleOpen = true }: { items: FAQItem[]; singleOpen?: boolean }) {
  return (
    <section className="faq">
      <FAQHeader />
      <Accordion type={singleOpen ? 'single' : 'multiple'} collapsible className="faq-list">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="faq-card">
            <AccordionTrigger className="faq-trigger">{item.q}</AccordionTrigger>
            <AccordionContent className="faq-answer">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

Customize the trigger icon (replace the default chevron with a `+`/`×` rotation) by editing the `AccordionTrigger` in `components/ui/accordion.tsx` — swap the `ChevronDown` icon and adjust the `data-[state=open]:rotate-180` class to `data-[state=open]:rotate-45` for the `+` → `×` effect.

---

## 5. Interaction & motion

shadcn's `Accordion` handles most of this automatically via Radix UI primitives:

- **Trigger:** `AccordionTrigger` renders a full-width `<button>` — the entire question row is the clickable target.
- **Icon:** customize in `components/ui/accordion.tsx` — replace the default `ChevronDown` with a `Plus` icon and use `data-[state=open]:rotate-45` for the `+` → `×` rotation. The built-in `transition: transform 200ms ease` class handles the animation.
- **Panel open/close:** Radix's `AccordionContent` uses CSS `grid-template-rows: 0fr → 1fr` animation internally. No custom height animation needed.
- **Hover:** apply via Tailwind on `AccordionItem`: `hover:bg-[var(--faq-card-hover)]`, `transition-colors duration-150`. Cursor pointer is automatic on the trigger.
- **Answer padding:** style `AccordionContent` children with `pt-2 pb-[var(--faq-card-pad-y)]` for breathing room.
- Respect `prefers-reduced-motion`: shadcn/Radix respects this natively; the global `@media (prefers-reduced-motion: reduce)` guard drops transitions.

---

## 6. Accessibility

shadcn's `Accordion` (via Radix UI) handles all accessibility out of the box:

- `AccordionTrigger` renders a `<button>` with `aria-expanded` and `aria-controls` pointing at the content panel — no manual wiring needed.
- `AccordionContent` receives the correct `id`, `role="region"`, and `aria-labelledby` automatically.
- Keyboard: Enter/Space toggle, focus management, and visible focus rings are built in via Radix primitives.
- Icon within the trigger is decorative (`aria-hidden="true"` on the icon element).
- Heading is an `<h2>` (assuming there's an `<h1>` higher on the homepage).

---

## 7. FAQ content (data array)

Fill the `[bracketed]` parts before shipping. Drop unused items.

```js
export const faqItems = [
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
```

---

## 8. Header copy

```
Heading:  FAQ
Subtitle: Find answers to common questions
          about the roadmap, pricing, and access.
```

(Original reference said "about our platform, pricing, and process" — swap "platform/process" for words that fit cpproad, e.g. "the roadmap, pricing, and access.")

---

## 9. Build checklist for Claude Code

1. Ensure shadcn `accordion` is installed: `npx shadcn@latest add accordion`.
2. Customize `components/ui/accordion.tsx` — swap `ChevronDown` for `Plus` icon, add `data-[state=open]:rotate-45` for the `+` → `×` effect, apply the glossy card tokens from §3.
3. Create `components/FAQ.tsx` with `FAQ` and `FAQHeader`, composing shadcn's `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
4. Put `faqItems` from §7 in `data/faq.ts`.
5. Apply tokens from §3 — match the existing site palette if it already defines dark theme variables; reuse those instead of hardcoding.
6. Set `type="single"` and `collapsible` on the `Accordion` for single-open behavior.
7. Accessibility is handled by Radix/shadcn — verify: keyboard toggle, reduced-motion, mobile width (title scales to ~44px, container padding holds).
8. Drop the section onto the homepage where the FAQ should live.

---

## 10. Notes / open items

- This spec is reverse-engineered from a screenshot of a *different* site (getcracked.io's FAQ), not from cpproad's live styles. Before merging, reconcile the tokens in §3 against cpproad's existing theme so fonts, radius, and exact charcoal match the rest of the homepage.
- The questions are written for a beginner audience around cpproad's actual features (in-browser sandbox + AI tutor, basics-through-templates path). If any feature claim isn't exactly true yet (e.g. the tutor's scope, what the path ends on), tweak the wording in §7 to match the shipped product.
