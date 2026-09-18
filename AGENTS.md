# Project context

LinkedIn post automation app — AI agent that discovers trending AI/ML/data topics, generates storytelling-style LinkedIn posts, and schedules daily publishing via LinkedIn's API.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- AI generation: Anthropic Claude API
- Scheduling: BullMQ (Redis-backed job queue) — not bare node-cron, jobs must survive server restarts
- Database: PostgreSQL (settings, schedule configs, post history) + Redis (BullMQ queue, token cache)
- LinkedIn integration: LinkedIn REST API v2, `/v2/ugcPosts`, OAuth 2.0

## Key architectural goal
Posts are pushed into LinkedIn's native scheduler queue via the `ugcPosts` API using `scheduledPublishTime` — not a self-managed publish-at-time-X worker. Confirm this is still the approach before changing the scheduling flow.

## Conventions
- JavaScript only — no TypeScript migration mid-project.
- Disabling the schedule must stop all future jobs within one request — no orphaned BullMQ jobs left in Redis.
- Any code touching the LinkedIn OAuth flow or token storage: flag it clearly, don't silently change scopes or token handling.

## Memory protocol
- At the start of every session, read `MEMORY.md` in full before doing anything else.
- Before ending a session (or when the user says "wrap up" / "done for now"), append a new dated entry to `MEMORY.md`:
  - What was built or changed, and why.
  - Any decisions made (and rejected alternatives, if relevant).
  - Open issues, known bugs, or things left half-done.
  - What the logical next step is.
- Never delete or rewrite prior `MEMORY.md` entries — only append. If something in an old entry is now wrong or outdated, add a new entry that says so instead of editing history.
- If you're unsure whether something is "memory-worthy," err toward writing it down — a stale note is cheap, a lost decision isn't.
