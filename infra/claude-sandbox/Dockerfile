# Sandboxed Claude Code: a non-root container with a C++ toolchain.
# --dangerously-skip-permissions refuses to run as root, so running as the
# unprivileged `node` user (uid 1000) IS the sandbox boundary we want: the
# agent can do whatever it likes to the mounted repo, but nothing as root and
# nothing on the host outside that mount.
FROM node:22-bookworm

# g++/make so the agent can compile + run each exercise solution to self-test.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Make --dangerously-skip-permissions the default for `claude` in the sandbox.
# Real binary is /usr/local/bin/claude; this wrapper shadows it via an earlier
# PATH entry, so plain `claude` (interactive or scripted) always skips prompts.
RUN printf '#!/usr/bin/env bash\nexec /usr/local/bin/claude --dangerously-skip-permissions "$@"\n' \
      > /usr/local/sbin/claude \
    && chmod +x /usr/local/sbin/claude
ENV PATH="/usr/local/sbin:${PATH}"

USER node
WORKDIR /work
CMD ["bash"]
