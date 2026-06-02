# quality.md — Definition of Done

The gate every change must pass before it's considered done. A requirement from `requirements.md` is only complete when it also clears this file. When in doubt, this document wins over speed. Check items off honestly — do not mark done what you haven't verified.

---

## 1. Accessibility (non-negotiable)

- [ ] **Contrast.** Body and label text meets WCAG AA (≥ 4.5:1) against its actual background, including over the ambient glows. Large text/headings ≥ 3:1. Verify the worst-case spot (text over the brightest part of an orb), not just the average.
- [ ] **Reduced motion.** With `prefers-reduced-motion: reduce`, every animation is disabled or rendered as its instant final state: no load reveal, no count-up (show final number), no track-fill animation, no node pulse, frozen background orbs. Verify in devtools emulation.
- [ ] **Keyboard.** Every interactive element (CTA, road nodes, Tutor, heatmap cells if focusable) is reachable by Tab in a sensible order and operable by Enter/Space. Locked nodes are either skipped or clearly announced as locked.
- [ ] **Focus visible.** A clear, on-brand focus ring on every interactive element. Never `outline: none` without a replacement.
- [ ] **Semantics.** The road is a list (`<ol>`/`<ul>`) of modules, not a pile of divs. Headings are a real hierarchy (one `<h1>`). Icons that carry meaning (lock, check, flame) have accessible labels; decorative ones are `aria-hidden`.
- [ ] **Targets.** Interactive targets are ≥ 44×44px on touch.
- [ ] **Tooltips.** Hover-only info (Tutor label, heatmap cell, locked node) is also available on focus, not hover-only.

## 2. Responsive

- [ ] Usable and good-looking from **360px** wide to large desktop. No horizontal scroll at any width.
- [ ] The road renders **vertical/stacked** on mobile and the wider layout on desktop (per `design.md` §5.3); the transition between them has no broken intermediate state.
- [ ] Text never clips or overflows its card at any breakpoint (test long module names and double/triple-digit counts).
- [ ] Tap targets don't overlap on mobile; cards reflow rather than squashing.

## 3. Performance

- [ ] **No scroll/idle jank.** Background orbs and the active-node pulse animate `transform`/`opacity` only — never `width`, `top`, `box-shadow` size, or other layout/paint-thrashing properties. Confirm 60fps in the Performance panel.
- [ ] **backdrop-filter cost.** Glass blur is used on a bounded number of elements; the background is one layer, not duplicated per card. If blur tanks performance on low-end hardware, reduce blur radius before removing the effect.
- [ ] **No layout shift.** Count-up uses tabular/mono figures and reserved width so numbers don't reflow. CLS stays ~0. Fonts load without a jarring swap (use `font-display: swap` + sensible fallback metrics).
- [ ] **Bundle.** Only the agreed animation lib is added (no second one). No charting library for the heatmap. Tree-shake icon imports.
- [ ] Lighthouse (mobile) Performance and Accessibility both ≥ 90 on the dashboard route, or a noted reason why not.

## 4. Correctness

- [ ] **REQ-2 verified.** With a fresh zero-progress user: module 1 is unlocked and active, "you're here" points to it, later modules locked. With partial progress: lock/active derive correctly. Cover this with a unit test on `lib/path.ts`.
- [ ] **Zero states (REQ-1).** No lone "0" anywhere; every metric has motivating zero copy; the populated state uses the same components.
- [ ] **Code preview (REQ-6).** Never clips a line raw; mask or complete snippet only; syntax-highlighted mono.
- [ ] **Graceful degradation.** Missing name → clean generic greeting (no "undefined"). Missing/empty activity data → inviting empty heatmap, not a gap or error.
- [ ] **No regressions.** Progress, streak, and lesson-count math are unchanged (except REQ-2). Existing routes and links still work.

## 5. Visual quality

- [ ] Matches the aesthetic direction in `design.md` §1 (technical, calm, premium — not gamey, not generic).
- [ ] Hierarchy reads by luminance: hero brightest, active node clearly the focal point, locked content recedes.
- [ ] One coherent card system — no one-off card styling, no inconsistent radii/borders.
- [ ] Spacing is consistent and on a scale; alignment is tight; nothing is visually orphaned.
- [ ] Motion feels like one intentional choreography, not scattered twitches. Nothing loops fast enough to distract while reading.
- [ ] No generic AI tells: no Inter/system-font headings, no purple-on-white gradient, no default Tailwind-demo look.

## 6. Code quality

- [ ] **Tokens only** — no hardcoded colors/radii/durations in components; everything reads from the token layer.
- [ ] Components are reused, not copy-pasted (`GlassCard` is the single source of card styling).
- [ ] TypeScript: no `any` on new code, props typed, no new type errors.
- [ ] Lint/format clean per the repo's existing config.
- [ ] Scope respected (`STEERING.md`): only dashboard + its dependencies touched; assumptions noted in comments where the real data shape was inferred.
- [ ] Commits follow the build order in `design.md` §8 and are individually reviewable.

## 7. Final pass

- [ ] View the live dashboard at 360px, ~768px, and desktop with motion on, then again with reduced-motion on. Both feel finished.
- [ ] Re-read each requirement in `requirements.md` and confirm its acceptance criteria are actually met, not approximately met.
- [ ] Anything deferred or assumed is written down for the user, not buried.
