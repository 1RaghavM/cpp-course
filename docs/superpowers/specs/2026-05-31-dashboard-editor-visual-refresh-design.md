# Dashboard & Editor Visual Refresh

> Unify the app's dashboard and code editor with the homepage design system. Visual-only changes — no functional modifications.

## Context

The homepage uses a Vercel/GitHub-inspired design system: near-black blue-tinted surfaces, single blue accent, Geist fonts, 1px hairline borders. The dashboard and editor pages use a different system: warm neutral grays, teal accent, Plus Jakarta Sans + Fraunces + JetBrains Mono. This creates visual discontinuity when navigating from homepage to app.

## Decisions

1. **Replace globals** — promote homepage tokens to `:root` in `globals.css`, replacing the current HSL variables. One unified design system.
2. **Switch to Geist fonts** — replace Plus Jakarta Sans, Fraunces, JetBrains Mono with Geist Sans + Geist Mono via the `geist` npm package.
3. **Single accent blue** — remove multi-color chapter hues, use `#2f81f7` throughout.
4. **Custom Monaco theme** — define a GitHub-dark theme matching the homepage syntax palette.

## 1. Global Tokens (globals.css)

Replace `:root` CSS variables:

| Token | Old value | New value |
|-------|-----------|-----------|
| bg-base | `0 0% 10%` | `#0a0a0a` |
| bg-surface | `0 0% 14%` | `#0f1115` |
| bg-elevated | `0 0% 18%` | `#161b22` |
| bg-hover | `0 0% 22%` | `#1c2128` |
| border | `0 0% 22%` | `#23262d` |
| border-subtle | `0 0% 18%` | `#30363d` |
| text-primary | `0 0% 95%` | `#ededed` |
| text-secondary | `0 0% 65%` | `#8b949e` |
| text-muted | `0 0% 45%` | `#6e7681` |
| accent | `168 76% 42%` | `#2f81f7` |
| accent-hover | `168 76% 48%` | `#58a6ff` |
| accent-fg | `0 0% 10%` | `#ffffff` |

Semantic colors (success, error, warning) stay as-is.

The Tailwind config color mapping keeps the same class names (bg-base, bg-surface, text-primary, etc.) — only the underlying CSS variable values change. This means most component classnames need zero changes.

The CSS variables switch from HSL channel format (`0 0% 10%`) to direct hex values (`#0a0a0a`). The Tailwind config changes from `hsl(var(--x))` to `var(--x)` since the variables now contain complete color values. This is a one-time migration — all Tailwind classes like `bg-base`, `text-primary` etc. continue to work unchanged.

## 2. Fonts

**Root layout (`app/layout.tsx`):**
- Remove: `Fraunces`, `Plus_Jakarta_Sans`, `JetBrains_Mono` from `next/font/google`
- Add: `import { GeistSans } from 'geist/font/sans'` and `import { GeistMono } from 'geist/font/mono'`
- Apply `GeistSans.variable` and `GeistMono.variable` to `<html>`

**Tailwind fontFamily:**
- `font-sans` and `font-display` both map to `var(--font-geist-sans)`
- `font-mono` maps to `var(--font-geist-mono)`

**Typography style:**
- Headings: weight 600, tracking `-0.02em`
- Body: weight 400
- AppHeader wordmark: monospace `cpproad` (no italic display split)

Requires: `npm install geist`

## 3. Component Visual Changes

### AppHeader
- Border: `1px solid var(--border)` (hairline)
- Wordmark: monospace `cpproad`, no italic split
- Progress bar: blue accent

### ChapterSidebar
- Remove `chapterHues` array and `getChapterColors` function
- All badges: `bg: rgba(47,129,247,0.1)`, `text: #58a6ff`
- All progress bars: `#2f81f7`
- Selected state: `border-left: 2px solid var(--accent)`

### ChapterDetail
- Remove `chapterHues`/`getChapterColors` (duplicated from sidebar)
- Badges and progress bars use single blue
- State indicators unchanged (success=green, in_progress=blue, not_started=muted, skipped=warning)

### LessonClient (editor page)
- Left panel bg: `var(--surface)` (`#0f1115`)
- Right panel bg: `var(--base)` (`#0a0a0a`)
- Lesson nav bar: `var(--elevated)` (`#161b22`) + bottom hairline
- Tab underline: `var(--accent)` (`#2f81f7`)
- Submit button: solid white primary (`#fff` bg, `#000` text)
- Run button: ghost secondary (transparent bg, hairline border)

### EditorToolbar
- Background: `var(--elevated)`
- Select dropdown: `var(--surface)` bg, hairline border

### OutputPanel
- Console header: `var(--elevated)`
- Output area: `var(--base)`
- Status badges: unchanged semantic colors on new surfaces

### ContinueLearning card
- Border: hairline (`var(--border)`)
- CTA button: solid white primary instead of filled accent

## 4. Custom Monaco Theme

Register a custom theme in `MonacoEditor.tsx` via `monaco.editor.defineTheme()`:

```
Editor background:   #0f1115
Editor foreground:   #e6edf3
Line numbers:        #6e7681
Selection:           rgba(47,129,247,0.2)
Current line:        #161b22

Token colors:
  keyword:    #ff7b72  (int, return, class, const, #include)
  string:     #a5d6ff  ("...", <iostream>)
  function:   #d2a8ff  (entity names)
  number:     #79c0ff  (numeric, constants)
  comment:    #8b949e
  variable:   #ffa657
  default:    #e6edf3
```

Applied via `monaco.editor.setTheme('cpproad-dark')` after definition.

## 5. What Stays Unchanged

- All data fetching, routing, auth, submissions, progress tracking
- Split-pane editor layout, sidebar structure, tab system DOM
- Semantic color roles (success/error/warning HSL values)
- `homepage.css` scoped styles (now naturally aligned with globals)
- Auth page styles (already use homepage tokens)

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `geist` dependency |
| `app/globals.css` | Replace `:root` variables with homepage tokens |
| `app/layout.tsx` | Switch fonts to Geist Sans + Geist Mono |
| `tailwind.config.ts` | Update color mappings from HSL to hex vars |
| `components/layout/AppHeader.tsx` | Monospace wordmark, remove italic split |
| `components/home/ChapterSidebar.tsx` | Remove multi-hue, single blue accent |
| `components/home/ChapterDetail.tsx` | Remove multi-hue, single blue accent |
| `components/home/ContinueLearning.tsx` | White primary CTA button |
| `components/lesson/OutputPanel.tsx` | Submit button to white primary |
| `components/editor/MonacoEditor.tsx` | Custom GitHub-dark theme |

No new files created. No files deleted.
