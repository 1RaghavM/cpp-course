# FAQ Section Design

## Overview

Add an accordion-style FAQ section to the cpproad marketing homepage. Positioned between CurriculumTabs and FinalCTA to address objections before the closing call-to-action.

## Decisions

- **Match existing homepage aesthetic** — no glossy gradient cards. Use flat `--color-surface` backgrounds with `--color-border` hairline borders, consistent with BentoGrid/SpotlightCard/feature cards.
- **Single-open accordion** — opening one item closes the others. Controlled via `useState<number | null>(null)`.
- **Approach A: single client component with inline styles** — matches the pattern used by FinalCTA, Footer, and other marketing components (inline styles referencing CSS custom properties, no Tailwind).

## File & Placement

- **File:** `app/(marketing)/components/FAQ.tsx` (`'use client'`)
- **Data:** `faqItems` array at the top of the same file
- **Homepage order:** Hero > BentoGrid > CurriculumTabs > **FAQ** > FinalCTA > Footer
- **Import added to:** `app/(marketing)/page.tsx`

## Structure

```
<section>  (hp-section hp-section-border)
  <div>   (hp-container, narrowed to ~770px via inline maxWidth)
    <Reveal>
      <h2>  "FAQ"
      <p>   subtitle
    </Reveal>
    <div>   (item stack, gap 12px)
      <FAQItem /> x 8
    </div>
  </div>
</section>
```

## Token Mapping

The design doc (cpproad-faq-design-doc.md) tokens are reverse-engineered from a different site. These are reconciled to the existing homepage theme:

| Design doc token | Mapped to | Value |
|---|---|---|
| `--faq-bg` (#000) | Inherited `--color-bg` | #0a0a0a |
| `--faq-card` (#161616) | `--color-surface` | #0f1115 |
| `--faq-card-hover` (#1f1f1f) | `--color-surface-2` | #161b22 |
| Glossy gradient | Dropped | Flat surface + hairline border |
| `--faq-radius` (18px) | `--radius-lg` | 12px |
| `--faq-text` | `--color-fg` | #ededed |
| `--faq-muted` | `--color-fg-muted` | #8b949e |
| `--faq-icon` | `--color-fg-subtle` | #6e7681 |
| Title 64px/44px | `--text-h2` | clamp(1.75rem, 3vw, 2.25rem) |
| Question 17px | `--text-body` | 1.0625rem |
| Answer 16px | `1rem` | 1rem |

## Accordion Behavior

- **Trigger:** Full-width `<button>` for the question row. Question text left, +/x icon right.
- **Icon:** `+` that rotates 45deg to become `x` when open. `transition: transform 200ms ease`.
- **Panel animation:** CSS grid trick — `grid-template-rows: 0fr` (collapsed) to `1fr` (open) with `transition: grid-template-rows 250ms ease`. Inner child has `overflow: hidden`.
- **Hover:** Background transitions from `--color-surface` to `--color-surface-2`, `150ms ease`. Cursor pointer.

## Accessibility

- Button: `aria-expanded={open}`, `aria-controls="faq-panel-{i}"`, `id="faq-q-{i}"`
- Panel: `id="faq-panel-{i}"`, `role="region"`, `aria-labelledby="faq-q-{i}"`
- Icon: `aria-hidden="true"`
- Heading: `<h2>` (Hero already has `<h1>`)
- Focus ring: existing `[data-page="homepage"] button:focus-visible` rule in homepage.css
- Reduced motion: existing global rule in homepage.css handles this

## Content

8 FAQ items from the design doc (section 7), used verbatim:

1. Do I need to install a compiler or set anything up?
2. I've never written a line of code. Is C++ too hard to start with?
3. What's the AI tutor, and how is it different from just asking ChatGPT?
4. Do I actually write code, or is it just videos and quizzes?
5. How is this different from free stuff like YouTube or learncpp.com?
6. What does the roadmap actually cover?
7. How soon can I write a real program?
8. What if I get stuck and there's no one to ask?

### Header Copy

- Heading: "FAQ"
- Subtitle: "Find answers to common questions about the roadmap, pricing, and access."
