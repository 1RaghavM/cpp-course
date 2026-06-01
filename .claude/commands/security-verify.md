# Security Verify

Run this after any change to Judge0 infrastructure, auth middleware, RLS policies, or deployment configuration. Combines the sandbox security checklist and the authentication/isolation enforcement — both must pass before deploying.

## Part 1: Judge0 Sandbox

Verify every item. A single failure is a P0 blocker.

### Configuration checks

- [ ] Judge0 version pinned to >= 1.13.1 (patched against CVE-2024-29021)
- [ ] Container runtime is `runsc` (gVisor) — verify with `docker inspect`
- [ ] Container is NOT `--privileged`
- [ ] `--security-opt=no-new-privileges` is set
- [ ] `enable_network=false` in Judge0 config (no outbound from sandbox)
- [ ] CPU limit <= 1 core, memory <= 256MB, pids <= 64
- [ ] Container runs as non-root (uid 1000)
- [ ] Root filesystem is read-only; only `/tmp` is writable
- [ ] `X-Auth-Token` header required on all Judge0 API requests
- [ ] Judge0 host reachable only from Vercel deployment (IP allow-list or private network)
- [ ] Source code submissions > 50KB rejected at the API layer

### Malicious C++ test suite

Run these against the actual Judge0 deployment. Every one must produce a safe verdict (TLE, MLE, permission denied, or kill — never success or host impact):

```cpp
// FORK BOMB — expect TLE or pids limit kill
int main(){ while(1) fork(); }

// NETWORK EGRESS — expect ENETUNREACH or similar failure
#include <sys/socket.h>
// attempt connect to 1.1.1.1:80

// FILESYSTEM ESCAPE — expect permission denied
#include <fstream>
int main(){ std::ofstream("/etc/passwd_pwn") << "x"; }

// MEMORY EXHAUSTION — expect MLE
#include <vector>
int main(){ std::vector<char> v; while(true) v.push_back(0); }

// INFINITE LOOP — expect TLE at 5s
int main(){ while(true) {} }

// PROCESS ENUMERATION — expect only own process tree visible
#include <cstdlib>
int main(){ system("ps auxf"); }
```

If any of these escapes the sandbox or hangs the host, fix before anything else.

## Part 2: Authentication & User Isolation

- [ ] `middleware.ts` rejects every unauthenticated request to `/(app)/` and `/api/` routes (returns 401)
- [ ] RLS policies on per-user tables enforce `user_id = auth.uid()` (progress, submissions, conversations, messages)
- [ ] Shared content tables (lessons, exercises, test_cases) have read-only policies for authenticated users
- [ ] No user can access another user's submissions, conversations, or progress
- [ ] Anthropic API key, Supabase service role key, Judge0 token — NEVER in client-side code
- [ ] Client-side code uses only the Supabase anon key
- [ ] `.env.local` is in `.gitignore`

### Manual deploy verification

After every deploy:
1. Hit `/api/roadmap` without a session — confirm 401.
2. Sign in as user A, create a submission. Sign in as user B — confirm user B cannot see user A's submissions.

## When to run this

- After any change to `infra/judge0/`
- After any change to `middleware.ts` or `lib/auth/`
- After adding or modifying RLS policies in `infra/supabase/migrations/`
- After any Fly.io or Judge0 version update
- Before first production deploy
