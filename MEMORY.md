# Project memory log

Append-only. Newest entries at the bottom. Do not edit or delete past entries.

## 2026-09-01 — Seed entry (manual)
- Stack finalized: React/Vite frontend, Node/Express backend, Claude API for generation, BullMQ/Redis for scheduling, Postgres for persistence, LinkedIn API v2 for posting.
- MVP status: topic discovery, topic selection UI, and AI post generation are believed built. Scheduling functionality reported as built but not yet confirmed end-to-end.
- Open questions carried over, not yet resolved:
  - Has the LinkedIn developer app actually been approved for `w_member_social` scope, or is this still assumed?
  - Is the scheduler actually pushing into LinkedIn's native queue via `ugcPosts` + `scheduledPublishTime`, or self-managing publish timing?
  - No confirmed answer yet on how "trending" topics are scored (dedupe/score logic was stubbed, not fleshed out, in earlier planning).
- Next step: verify LinkedIn API approval status and confirm the scheduler's actual publish mechanism before building further on top of it.
