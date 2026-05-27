# Scope Check

Run this before building any new feature or accepting a feature request. This project is a personal learning tool for one user — scope creep kills side projects.

## Decision filter (in order)

1. **Will building this help me actually learn C++?** If no, drop it.
2. **Can I ship a working version this weekend?** If no, cut the scope in half and try again.
3. **Am I building this for a hypothetical future user?** If yes, stop. There is no future user.
4. **What's the dumbest version that works?** Build that.

## Exclusion list

These are permanently out of scope. Do not build, even partially:

- Multi-user features (no signup, no roles, no sharing)
- Payments or monetization
- Public landing page or marketing site
- Privacy policy, ToS, cookie banner, GDPR export
- Native mobile apps
- Social features (comments, leaderboards, profiles)
- Admin tooling (use psql directly)
- Multi-file C++ exercises (single `main.cpp` per exercise)
- Language servers, IntelliSense, in-browser debugger
- Monitoring infra (Sentry, Datadog, Grafana)
- Automated content moderation
- Certificates or credentials
- Status page, alerting, on-call rotation
- A pretty 404 page

## Anti-patterns to catch yourself doing

- Adding a feature because "future users might want it"
- Setting up monitoring for a single-user app
- Generalizing code used in one place
- Building admin tooling when you have psql
- Tweaking prompts instead of using the app to learn C++
- Adding "just one more piece of infra"

## If the feature passes

Proceed. Keep the implementation minimal. Default to the boring solution.
