# T04: Supabase Client Library

## Wave: 1 (depends on T01)

## Dependencies

- **T01** — project must be scaffolded with `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs` installed

## Objective

Create the Supabase client wrappers used by every other module. Two clients: a server-side client (with service role key for Route Handlers) and a browser-side client (with anon key for client components).

## Files to create

```
lib/supabase/server.ts       # server-side Supabase client (Route Handlers + Server Components)
lib/supabase/client.ts       # browser-side Supabase client (Client Components)
lib/supabase/types.ts        # TypeScript types generated from the schema
```

## Implementation

### lib/supabase/server.ts

Creates a Supabase client for use in Route Handlers and Server Components:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';
```

Export two functions:
- `createRouteClient()` — uses `createRouteHandlerClient<Database>({ cookies })` for Route Handlers
- `createServerClient()` — uses `createServerComponentClient<Database>({ cookies })` for Server Components

Both read from env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (default)
- Never use `SUPABASE_SERVICE_ROLE_KEY` in the client creation — use it only for specific admin operations (like seed script)

### lib/supabase/client.ts

Browser-side client for `'use client'` components:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

export const createBrowserClient = () => createClientComponentClient<Database>();
```

Uses only the anon key (from `NEXT_PUBLIC_*` env vars). Service role key must NEVER appear in this file.

### lib/supabase/types.ts

TypeScript types matching the database schema from T02. This file would normally be auto-generated via `npx supabase gen types typescript`, but since the DB may not exist yet during development, write the types manually to match the schema in `design.md` section 3.2.

Define a `Database` type with `public` schema containing all 9 tables with their Row, Insert, and Update types. Key types to export individually for convenience:

```typescript
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type TestCase = Database['public']['Tables']['test_cases']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Progress = Database['public']['Tables']['progress']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type TokenUsage = Database['public']['Tables']['token_usage']['Row'];
```

## Conventions

- Absolute imports: `import { createRouteClient } from '@/lib/supabase/server'`
- All DB queries go through these clients — no raw `supabase-js` instantiation elsewhere
- Types must match the schema in T02 exactly

## Skills to reference

- `/project:security-verify` — Part 2: anon key on client only, service role key on server only

## Acceptance criteria

- [ ] `createRouteClient()` returns a typed Supabase client
- [ ] `createServerClient()` returns a typed Supabase client
- [ ] `createBrowserClient()` returns a typed Supabase client
- [ ] All three clients use the `Database` generic for type safety
- [ ] Service role key does NOT appear in `client.ts`
- [ ] Types match the schema from T02 (all 9 tables, correct column types)
- [ ] TypeScript compiles without errors
