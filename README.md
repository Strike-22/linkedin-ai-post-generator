# LinkedIn AI Post Generator

An end-to-end tool that generates educational LinkedIn posts using Google Gemini, manages a content queue, and publishes directly to LinkedIn — with optional daily scheduling via Redis-backed BullMQ job queues.

## Development Notes

This project was built with AI-assisted development (Claude, OpenCode, and Gemini for content generation). I directed the architecture, debugged issues, made product decisions (template design, topic strategy, image prompt logic), and iterated based on real LinkedIn performance data. AI tools helped with implementation speed, not the underlying judgment calls.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS, JavaScript (no framework). Static files served by the Express backend. |
| **Backend** | Node.js (>=20, ESM), Express 4 |
| **AI / LLM** | Google Gemini (`@google/genai` SDK) — post generation, topic generation, and image generation |
| **Job Queue** | BullMQ 5 + Redis (via `ioredis`) — powers the daily schedule feature |
| **LinkedIn API** | Axios — OAuth, text posting, image posting via `ugcPosts` |
| **File Uploads** | Multer |
| **RSS** | `rss-parser` |
| **Other** | CORS, dotenv |

### No Database
State is kept in:
- **localStorage** (frontend): theme, publish time, timezone, schedule toggle, run log
- **JSON file** (backend): `publish-log.json` (last 50 entries)
- **In-memory Map** (backend): active scheduled job records in `scheduler.js`

---

## Project Structure

```
├── index.html          # Single-page app shell
├── styles.css          # Full stylesheet (light + dark theme)
├── app.js              # Frontend logic (topics, generation, publish, schedule UI)
├── backend/
│   ├── server.js       # Express server — all API routes, OAuth, static files
│   ├── .env            # Secrets & config (API keys, Redis URL, ports)
│   ├── package.json
│   ├── config/
│   │   └── redis.js    # Redis connection via ioredis
│   ├── services/
│   │   ├── postGenerator.js      # Gemini-powered post generation (5 template styles)
│   │   ├── trendFetcher.js       # 88 hardcoded topics across 8 categories (shuffled)
│   │   ├── scheduler.js          # BullMQ queue + worker — daily & one-off scheduling
│   │   ├── linkedin.js           # LinkedIn OAuth, text posting, image posting
│   │   ├── geminiImageGenerator.js # Gemini image generation (16:9 infographics)
│   │   ├── publishLog.js         # JSON file-based publish log
│   │   └── trendFetcher.old.js   # Previous RSS-based fetcher (unused)
│   ├── uploads/        # Temp multer uploads (auto-cleaned)
│   └── generated-images/ # Gemini-generated images (served statically)
├── image-examples/     # Sample generated images
└── pollinations-test/  # Test/experimental files
```

---

## API Routes (16 total)

### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check (`{ status: "ok", time }`) |

### Topic Discovery
`GET /api/trends?excluded=...&count=10` — Returns shuffled topics from 88 hardcoded items across 8 categories (SQL, Python, Excel, Power BI, Tableau, Data Analytics, Data Engineering, Data Science). Excludes previously seen titles.

`POST /api/topics/educational` — Generates fresh educational topics via Gemini (focused, specific titles, not broad categories).

### Post Generation
`POST /api/generate` — Generates a LinkedIn post via Gemini. Accepts `{ topic, tone, audience, length, previousTemplateStyle }`. Returns `{ postText, templateStyle, imageVisualBrief }`. Five template styles: Tip Stack, Mistake to Fix, X vs Y, Numbered Insights, Story to Lesson.

### Image Generation
`POST /api/images/generate` — Generates a 16:9 educational infographic via Gemini (`gemini-2.5-flash-image`). Saves to `generated-images/`, returns file path and URL.

`GET /generated-images/*` — Serves generated images statically.

### LinkedIn OAuth
`GET /auth/linkedin` — Redirects to LinkedIn OAuth authorization page.

`GET /auth/linkedin/callback` — Handles OAuth callback, exchanges code for token, displays `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` to copy into `.env`.

`GET /api/me` — Returns current profile info from stored token.

### Publishing
`POST /api/publish` — Publishes text-only post to LinkedIn via `ugcPosts`.

`POST /api/publish/image` — Publishes post with image (multipart: `postText` + `image` file). Registers upload with LinkedIn, uploads binary, then posts with `shareMediaCategory: IMAGE`.

`GET /api/publish/log` — Reads `publish-log.json` (last 50 entries).

### Scheduling (requires Redis)
`POST /api/schedule` — Schedules a one-time post. Accepts `{ topic, tone, audience, length, scheduledTime }`.

`POST /api/schedule/daily` — Schedules recurring daily post. Accepts `{ topic, tone, audience, length, publishTime, timezone }`. Uses BullMQ repeatable jobs with cron pattern. This is the route called by the Schedule toggle in the UI.

`GET /api/schedule` — Lists all active scheduled jobs.

`DELETE /api/schedule/:jobId` — Cancels a scheduled job.

---

## Setup

### Prerequisites
- Node.js >= 20
- Redis (required for scheduling; local install or Docker)

### 1. Clone and install
```bash
cd backend
npm install
```

### 2. Configure `.env`
Copy `.env.example` to `.env` and fill in:

```env
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

LINKEDIN_CLIENT_ID=your_linkedin_app_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_app_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:4000/auth/linkedin/callback
LINKEDIN_ACCESS_TOKEN=from_oauth_flow
LINKEDIN_PERSON_URN=from_oauth_flow

REDIS_URL=redis://localhost:6379

PORT=4000
CORS_ORIGIN=http://localhost:3000   # Must match your frontend's actual address
```

### 3. Start Redis
```bash
# Docker
docker run -d -p 6379:6379 redis:7

# Or via local install
redis-server
```

### 4. Start the backend
```bash
cd backend
npm run dev     # node --watch server.js
```
Server starts at `http://localhost:4000`.

### 5. Open the frontend
Serve the root directory on port 3000 (or adjust `CORS_ORIGIN` to match):
```bash
# Using any static file server, e.g.:
npx serve . -p 3000
```
Then open `http://localhost:3000` in your browser.

### 6. LinkedIn OAuth (one-time)
Visit `http://localhost:4000/auth/linkedin`, authorize the app, and copy the returned token and person URN into `.env`.

---

## Usage Flow

1. **Browse topics** — topics load from the backend (shuffled from 88 hardcoded items, or generated fresh via Gemini).
2. **Dismiss unwanted topics** — hidden topics are replaced with new ones from the pool.
3. **Adjust settings** — tone (Insightful/Founder-like/Warm mentor/Contrarian), length (100/180/280 words), audience (Students/Instructors/Recruiters/General).
4. **Generate post** — calls Gemini with the selected template style. The post text appears in the editor.
5. **Copy image prompt** — get a formatted prompt to use in an external image tool (or use `/api/images/generate` to generate directly via Gemini).
6. **Upload image** — attach a PNG/JPG to include in the LinkedIn post.
7. **Publish** — text-only or with image, directly to your LinkedIn profile.
8. **Schedule** — enable the Schedule toggle to set up daily auto-publishing. The backend creates a BullMQ repeatable job that generates and publishes on the configured schedule.

---

## Template Styles (5)

| Style | Structure |
|-------|-----------|
| **Tip Stack** | Hook → bridge → 3 bullet tips with `→` → scenario with a number → engagement question → 5 hashtags |
| **Mistake to Fix** | Hook naming common mistake → why it's common → 2-3 `❌ Wrong → ✅ Fix` pairs → before/after with number → CTA → 5 hashtags |
| **X vs Y** | Hook naming two competing approaches → all points for A → all points for B → numbered scenario → question → 5 hashtags |
| **Numbered Insights** | Hook → bridge → 3-5 numbered tips → "Save this" CTA → 5 hashtags |
| **Story to Lesson** | Personal/relatable story → turning point → 2-3 takeaways with code → number-backed connection → CTA → 5 hashtags |

---

## Known Constraints

- **CORS_ORIGIN must match your frontend port.** The `.env` default is `http://localhost:5173` (Vite default), but if you serve the frontend with a simple static server (e.g., `npx serve`), the default port is 3000. Set `CORS_ORIGIN=http://localhost:3000` in `.env` to match, or whatever port your frontend actually runs on. Mismatched origins will cause CORS-blocked requests.
- **Redis must be running locally** for the Schedule feature (BullMQ queue) to work. Without Redis, the schedule toggle and all `/api/schedule/*` routes will fail. Basic post generation and publishing still work without Redis.
- **Scheduler (backend/services/scheduler.js) is fully implemented via Redis + BullMQ and can auto-publish posts on a daily schedule. However, it is currently disabled in normal use — daily posting is done manually by generating a post, then either publishing immediately via the app or scheduling it through LinkedIn's own native post scheduler.**
- **LinkedIn API tokens expire.** The OAuth token obtained via the `/auth/linkedin/callback` flow has a limited lifetime (typically 60 days for `w_member_social`). You will need to re-authenticate when it expires.
- **LinkedIn API rate limits apply.** There is no built-in rate limiting on the publish routes. The scheduler processes one job at a time (`concurrency: 1`) but manual publishing has no guard.
- **No user authentication.** The frontend has no login system — it assumes a single operator. The LinkedIn token in `.env` determines whose profile posts go to.
- **Gemini models may change.** The `.env` defaults to `gemini-2.5-flash` for text and `gemini-2.5-flash-image` for images. These model names may need updating if Google deprecates or renames them.
- **File-based publish log.** `publish-log.json` stores only the last 50 entries. Old entries are silently dropped.
- **Scheduled job state is in-memory.** `scheduler.js` stores job records in a `Map`. If the backend restarts, scheduled jobs tracked in memory are lost (though BullMQ's Redis queue retains the jobs themselves — they will still fire, but the in-memory record won't exist for status lookups or cancellation).
