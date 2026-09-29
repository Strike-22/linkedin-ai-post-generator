# Project context

LinkedIn post generator - AI tool that discovers data analytics/SQL/Excel/Python topics, generates LinkedIn posts via Gemini with 5 rotating template styles, generates a matching image prompt per post, and publishes to LinkedIn (manually triggered, not auto-scheduled in normal use).

## Stack
- Frontend: Vanilla HTML/CSS/JS (index.html, app.js, styles.css), served via npx serve
- Backend: Node.js + Express (server.js)
- AI generation: Google Gemini API (@google/genai), model gemini-2.5-flash
- Scheduling: BullMQ + Redis (scheduler.js) - implemented but currently DISABLED in normal use; daily posting is done manually
- Database: NONE. Topics are an in-memory static pool (trendFetcher.js, 88 topics). Publish history is a flat JSON file (publish-log.json), not SQL.
- LinkedIn integration: LinkedIn REST API v2, /v2/ugcPosts, OAuth 2.0

## Known gotchas
- topic.tag is a singular string, NOT topic.tags (array) - this was fixed once, don't reintroduce the old field name
- CORS_ORIGIN in .env must match the actual frontend port (npx serve defaults to 3000, .env may default to 5173)
- Gemini free tier: 20 requests/day - be economical with test generations

## Memory protocol
- At the start of every session, read `MEMORY.md` in full before doing anything else.
- Before ending a session (or when the user says "wrap up" / "done for now"), append a new dated entry to `MEMORY.md`:
  - What was built or changed, and why.
  - Any decisions made (and rejected alternatives, if relevant).
  - Open issues, known bugs, or things left half-done.
  - What the logical next step is.
- Never delete or rewrite prior `MEMORY.md` entries — only append. If something in an old entry is now wrong or outdated, add a new entry that says so instead of editing history.
- If you're unsure whether something is "memory-worthy," err toward writing it down — a stale note is cheap, a lost decision isn't.