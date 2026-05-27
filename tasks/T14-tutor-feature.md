# T14: Tutor Feature

## Wave: 4 (depends on T05, T06, T10, T11)

## Dependencies

- **T05** — Auth system (middleware protects routes)
- **T06** — Anthropic client library (streaming completions, tutor prompts, cost logging)
- **T10** — Lesson feature (lesson page exists, tutor panel attaches to it)
- **T11** — Code execution feature (current editor code and last submission are included in tutor context)

## Objective

Build the AI tutor — a chat panel on every lesson page where the user can ask questions. The tutor streams responses via SSE, follows a 4-tier hint policy, and persists all conversations to Postgres. Revisiting a conversation loads from cache without calling the LLM.

This is the most complex feature in the app. It combines streaming LLM calls, conversation persistence, hint tier computation, and context injection from the editor and submission history.

## Files to create

```
app/api/tutor/route.ts                       # POST /api/tutor (SSE streaming)
app/api/conversations/route.ts               # GET conversations for a lesson
app/api/conversations/[id]/route.ts          # GET full message history
components/tutor/ChatPanel.tsx               # the chat UI
components/tutor/TierBadge.tsx               # hint tier indicator
```

## Implementation

### app/api/tutor/route.ts

**POST /api/tutor** — Returns an SSE stream.

Request body:
```typescript
{
  lesson_id: string;
  conversation_id?: string;          // omit to create a new conversation
  content: string;                   // the user's message
  current_code?: string;            // current editor contents
  last_submission_id?: string;      // ID of the last submission for context
}
```

Response: SSE stream with events:
```
data: {"type": "token", "content": "The"}
data: {"type": "token", "content": " key"}
data: {"type": "token", "content": " insight"}
...
data: {"type": "done", "message_id": "uuid", "hint_tier": 2}
```

Logic:
1. If `conversation_id` is provided: load existing conversation + messages from DB
2. If not: create a new conversation row, link to `lesson_id`
3. Save the user's message to the `messages` table
4. Compute the current hint tier (see Hint Tier Logic below)
5. Load lesson context: `summary_md`, current exercise `prompt_md`
6. If `last_submission_id`: load the submission's stdout/stderr for context
7. Build the prompt using `getTutorPrompt()` from T06 (`lib/anthropic/prompts.ts`):
   - System prompt + lesson context marked with `cache_control`
   - Full conversation history as messages
   - Current code and submission output injected into the latest user context
8. Call `streamCompletion()` from T06 with Sonnet 4.6
9. Stream tokens to the client via SSE
10. On stream completion: save the assistant message to DB with `hint_tier`, token counts, model
11. Log cost to `token_usage` table

**Hint Tier Logic (FR-063):**

The tier escalates based on conversation turns on the same exercise:
- **T1** (turns 1-2): Ask a guiding question. No solution hints.
- **T2** (turns 3-4): Name the missing concept. No code.
- **T3** (turns 5-6): Sketch approach in pseudocode. No working C++.
- **T4** (turn 7+ OR explicit "show me"/"give me the answer"): Show working snippet.

Tier is passed to the prompt template, which instructs the model on how to respond.

Detection of explicit tier escalation: if the user's message contains phrases like "show me", "give me the answer", "just tell me", "I give up" → jump to T4 regardless of turn count.

### app/api/conversations/route.ts

**GET /api/conversations?lesson_id=...**

Returns a list of conversations for a lesson:
```typescript
Array<{
  id: string;
  title: string | null;       // auto-generated from first message
  createdAt: string;
  messageCount: number;
}>
```

Ordered by `created_at DESC`.

### app/api/conversations/[id]/route.ts

**GET /api/conversations/[id]**

Returns the full message history for a conversation:
```typescript
{
  id: string;
  lessonId: string;
  title: string | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    hintTier: number | null;
    createdAt: string;
  }>;
}
```

Messages ordered by `created_at ASC`. This is a pure cache read — no LLM calls.

### components/tutor/ChatPanel.tsx

Client component (`'use client'`). A slide-out or side panel on the lesson page.

Features:
- Message list: user messages right-aligned, assistant messages left-aligned
- Markdown rendering for assistant messages (with code block syntax highlighting)
- Input field at the bottom with send button
- Streaming display: assistant messages appear token-by-token as SSE events arrive
- "New conversation" button (FR-065) — starts fresh, old conversation stays in DB
- Conversation selector: dropdown or list of past conversations for this lesson, clicking one loads its history
- Current hint tier indicator via `<TierBadge />`
- Loading state while waiting for first token

Context injection (automatic, not visible to user):
- The panel reads the current Monaco editor content and last submission from parent component props/context
- Includes these in the POST to /api/tutor

### components/tutor/TierBadge.tsx

Small visual indicator showing the current hint tier:
- T1: "Guiding" (e.g., blue)
- T2: "Concept" (e.g., yellow)
- T3: "Approach" (e.g., orange)
- T4: "Solution" (e.g., green)

Tooltip or label explaining what each tier means.

## Conversation caching invariant

From `/project:cache-guard`: loading a past conversation is a pure DB read. Zero LLM calls until the user types a new message. The `GET /api/conversations/[id]` endpoint must NEVER call the Anthropic API.

## Skills to reference

- `/project:cache-guard` — conversation reload = zero LLM calls
- `/project:llm-integration` — Sonnet 4.6 for tutor, prompt caching on system+lesson context, 4-tier hint policy, cost logging
- `/project:new-route` — all three route handlers follow the standard pattern

## Acceptance criteria

- [ ] POST /api/tutor streams tokens via SSE
- [ ] Tokens render incrementally in the chat panel
- [ ] User and assistant messages are persisted to the DB
- [ ] Reloading the page shows the full conversation history (from DB, no LLM call)
- [ ] Hint tier escalates with conversation turns (T1→T2→T3→T4)
- [ ] "Show me the answer" jumps to T4 regardless of turn count
- [ ] Tier badge updates to reflect the current tier
- [ ] New conversation button creates a fresh conversation
- [ ] Past conversations are selectable and loadable
- [ ] Current editor code and last submission are included in tutor context
- [ ] Prompt caching is applied (system prompt + lesson context)
- [ ] Cost is logged to `token_usage` table for every tutor call
- [ ] Tutor uses Sonnet 4.6 (not Haiku)
- [ ] Prompt injection attempts get the deflection response
- [ ] Responses stay under 250 words except at T4
