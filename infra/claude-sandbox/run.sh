#!/usr/bin/env bash
set -euo pipefail

# Run Claude Code in a sandbox: non-root, repo mounted, C++ toolchain available.
# Only this repo is mounted — the rest of your laptop is invisible to the agent.
# `claude` inside the container always runs --dangerously-skip-permissions (baked
# into the image), so you never have to pass that flag yourself.
#
#   ./run.sh          # interactive claude session
#   ./run.sh shell    # bash into the container, then run `claude` yourself
#   ./run.sh auto     # headless — runs TASK.md to completion unattended
#
# Auth: uses ANTHROPIC_API_KEY (from your shell, or pulled from the repo .env).

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE=cpp-sandbox

docker build -t "$IMAGE" "$REPO/infra/claude-sandbox"

# Pull the API key from .env if it isn't already in the environment.
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -f "$REPO/.env" ]; then
  ANTHROPIC_API_KEY="$(grep -E '^ANTHROPIC_API_KEY=' "$REPO/.env" | head -1 | cut -d= -f2- || true)"
fi
case "${ANTHROPIC_API_KEY:-}" in
  ""|"<placeholder>") echo "WARN: ANTHROPIC_API_KEY not set — claude won't authenticate." >&2 ;;
esac

args=(--rm -v "$REPO:/work")
[ -n "${ANTHROPIC_API_KEY:-}" ] && args+=(-e "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY")

case "${1:-}" in
  shell) exec docker run -it "${args[@]}" "$IMAGE" bash ;;
  auto)  exec docker run -i  "${args[@]}" "$IMAGE" \
           claude -p "Follow infra/claude-sandbox/TASK.md to completion." ;;
  *)     exec docker run -it "${args[@]}" "$IMAGE" claude ;;
esac

# ponytail: whole repo is mounted (incl. .env secrets) so the agent has git +
# CLAUDE.md context. To narrow exposure, mount only scripts/regenerated and
# infra/claude-sandbox instead of "$REPO:/work".
