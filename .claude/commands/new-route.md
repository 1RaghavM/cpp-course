# New Route Handler

Follow this pattern when creating or modifying API route handlers. All routes live under `app/api/*/route.ts` — there is no separate backend service.

## Standard structure

```typescript
// app/api/example/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth is handled by middleware.ts (authentication check)
  // but verify session exists
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic here — query Supabase, call LLM if needed, etc.

  return NextResponse.json(data);
}
```

## Auth pattern

- Auth via Supabase session cookie (set by the auth flow)
- Authentication enforced in `middleware.ts` via `lib/auth/require-auth.ts` — route handlers don't need to re-check auth
- Route handlers DO need to verify a session exists (401 if not)

## Error responses

| Status | When |
|---|---|
| 401 | No session cookie / expired session (handled by middleware) |
| 400 | Bad input (missing required fields, invalid format, source code > 50KB) |
| 500 | Unexpected error (catch and return, don't crash the function) |

## API contracts

Match these response shapes from the design doc:

```
GET  /api/roadmap
     → { chapters: [{ id, number, my_title, lessons: [{ id, number, my_title, state }] }] }

GET  /api/lessons/[slug]
     → { id, title, summary_md, exercises: [...], conversations: [...] }
     (triggers generation inline if summary_md is NULL — first visit)

POST /api/lessons/[slug]/regenerate
     → 200 with new content (deletes + regenerates summary + exercises)

POST /api/submissions
     body: { exercise_id, source_code, mode: 'run' | 'submit', language_std? }
     → { status, stdout, stderr, test_results?, wall_time_ms }

POST /api/tutor  (SSE response)
     body: { lesson_id, conversation_id?, content, current_code?, last_submission_id? }
     → SSE stream of tokens, final 'done' event with message_id

GET  /api/conversations?lesson_id=...
     → list of conversations for that lesson

GET  /api/conversations/[id]
     → full message history

POST /api/progress/[lesson_id]
     body: { state: 'in_progress' | 'completed' | 'skipped' }
     → 204

GET  /api/stats/costs
     → { this_month_usd, by_call_type: [...], cache_hit_rate }
```

## Checklist for new routes

- [ ] File is at `app/api/<path>/route.ts`
- [ ] Exports only the HTTP methods it handles (GET, POST, etc.)
- [ ] Checks for session (returns 401 if missing)
- [ ] Validates input shape and returns 400 on bad input
- [ ] Uses Supabase server client (not anon client) for DB queries
- [ ] If calling LLM: routes through `lib/anthropic/client.ts` (see llm-integration)
- [ ] If calling Judge0: routes through `lib/judge0/client.ts`
- [ ] If touching lesson/exercise content: respects cache invariants (see cache-guard)
- [ ] Response shape matches the contract above
- [ ] TypeScript types are explicit (no `any`)
