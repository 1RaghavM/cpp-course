# T01: Project Scaffolding

## Wave: 0 (independent — no dependencies)

## Objective

Initialize the Next.js 14+ App Router project with TypeScript strict mode, Tailwind CSS, ESLint, Prettier, and the full directory skeleton. This task produces the foundation every other task builds on.

## Files to create

```
package.json
tsconfig.json
next.config.ts
tailwind.config.ts
postcss.config.js
.eslintrc.js
.prettierrc
.env.example
.gitignore
app/layout.tsx          # root layout with html/body, Tailwind globals
app/globals.css         # Tailwind directives + any base styles
components/ui/          # empty directory (shadcn primitives go here later)
```

## Requirements

### package.json dependencies

```
next (14+)
react, react-dom
typescript
@types/react, @types/node
tailwindcss, postcss, autoprefixer
eslint, eslint-config-next
prettier
@supabase/supabase-js, @supabase/auth-helpers-nextjs     (install now, used by T04/T05)
@anthropic-ai/sdk                                         (install now, used by T06)
@monaco-editor/react, monaco-editor                       (install now, used by T11)
```

### tsconfig.json

- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- Path alias: `"@/*": ["./*"]`

### .eslintrc.js

- Extends: `next/core-web-vitals`, `@typescript-eslint/recommended`
- No `any` without eslint-disable comment

### .prettierrc

- `printWidth: 100`
- Defaults otherwise

### .env.example

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Judge0
JUDGE0_URL=
JUDGE0_AUTH_TOKEN=

# Auth
OWNER_EMAIL=
```

### .gitignore

Standard Next.js gitignore plus:
- `.env.local`
- `.env*.local`
- `node_modules/`

### app/layout.tsx

Root layout with `<html>`, `<body>`, Tailwind globals imported. No auth logic here — that goes in the `(app)` layout (T09).

### app/globals.css

Tailwind `@tailwind base; @tailwind components; @tailwind utilities;` directives. Minimal custom styles. Dark-mode-friendly neutral palette.

## Conventions to follow

- Absolute imports via `@/*` alias
- Server components by default
- See `CLAUDE.md` for full code conventions

## Skills to reference

- `/project:scope-check` — this is scaffolding, not feature work; keep it minimal

## Acceptance criteria

- [ ] `npm install` succeeds
- [ ] `npm run dev` starts the Next.js dev server without errors
- [ ] `npm run build` produces a production build
- [ ] `npm run lint` passes
- [ ] `npx prettier --check .` passes
- [ ] TypeScript strict mode is enforced (test with a deliberate `any` — should fail lint)
- [ ] `@/*` path alias resolves correctly
