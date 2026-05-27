# Cache Guard

Run this checklist whenever modifying code that touches LLM calls, lesson/exercise loading, conversation retrieval, or the `lib/anthropic/`, `lib/content/`, or `app/api/lessons/` directories. The entire cost model depends on these invariants — if caching breaks, LLM spend blows up.

## Invariants to verify

1. **Lesson summaries:** A lesson row with non-NULL `summary_md` must NEVER trigger an LLM call when its page is loaded. The only path that calls the LLM is `summary_md IS NULL` (first visit).

2. **Exercises:** If exercises exist in the DB for a lesson, loading that lesson's page must NOT regenerate them. Exercises regenerate only via the explicit `POST /api/lessons/[slug]/regenerate` endpoint.

3. **Tutor conversations:** Reloading a conversation loads messages from Postgres. Zero LLM calls until the user types a new message.

4. **Prompt caching:** Every Anthropic API call with reusable context (system prompt + lesson context) must include `cache_control: { type: 'ephemeral' }` on those blocks. Without this, cached input tokens cost 10x more.

5. **Regeneration isolation:** `POST /api/lessons/[slug]/regenerate` is the ONLY path that deletes cached content and triggers fresh generation. No other endpoint should clear `summary_md` or delete exercises.

## How to verify

For each code path you're changing:

- Trace the request from the route handler to the database query
- Confirm there's a cache-hit branch that returns early without touching Anthropic
- Confirm `cache_control` is set in the `messages.create()` call
- If adding a new LLM call, ensure it writes output to Postgres so the next request can serve from cache
- Check that no code path accidentally nullifies `summary_md` or deletes exercise/test_case rows

## Red flags

- Any Anthropic API call that doesn't check the DB first
- Missing `cache_control` on system or lesson context blocks
- A route that writes to `summary_md` without being the regenerate endpoint
- LLM calls in client-side code (these bypass the server-side cache entirely)
