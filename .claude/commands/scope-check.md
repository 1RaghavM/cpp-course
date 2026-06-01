# Scope Check

Run this before building any new feature or accepting a feature request. This is a consumer-facing C++ learning platform — focus on the core learning experience and keep costs sustainable.

## Decision filter (in order)

1. **Does this help users learn C++ better?** If no, drop it.
2. **Can we ship a working version this weekend?** If no, cut the scope in half and try again.
3. **Does this scale with users without blowing up LLM costs?** The caching model must hold.
4. **What's the simplest version that works?** Build that.

## Exclusion list

These are out of scope for now. Do not build, even partially:

- Native mobile apps
- Social features (comments, leaderboards, profiles)
- Multi-file C++ exercises (single `main.cpp` per exercise)
- Language servers, IntelliSense, in-browser debugger
- Heavy monitoring infra (Sentry, Datadog, Grafana) — use Vercel/Supabase built-in
- Certificates or credentials
- Real-time collaboration between users
- Other programming languages

## Anti-patterns to catch yourself doing

- Adding a feature without evidence users need it
- Over-engineering infrastructure before traffic warrants it
- Generalizing code used in one place
- Tweaking prompts instead of shipping user-facing features
- Adding "just one more piece of infra"
- Breaking the caching model (costs scale with content, not with users)

## If the feature passes

Proceed. Keep the implementation minimal. Default to the boring solution.
