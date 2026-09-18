# Backend

Express backend for the LinkedIn educational post generator.

## Run

```cmd
npm.cmd install
npm.cmd run dev
```

## Main Routes

- `GET /health`
- `GET /api/me`
- `GET /api/trends`
- `POST /api/topics/educational`
- `POST /api/generate`
- `POST /api/publish`
- `POST /api/publish/image`
- `GET /api/publish/log`
- `POST /api/schedule`
- `POST /api/schedule/daily`
- `GET /api/schedule`
- `DELETE /api/schedule/:jobId`

## Post Generation Style

`POST /api/generate` uses Gemini to create beginner-friendly educational LinkedIn posts.

Current style rules:

- Focus areas: Excel, Power BI, SQL, Tableau, Python, machine learning, AI, deep learning, data science, and analytics.
- Uses varied beginner-friendly templates instead of one fixed format.
- Template styles include before/after, honest explanation, code-style, checklist, underrated concept, demystified concept, beginner mistake, and practical use-case formats.
- Keeps LinkedIn-friendly symbols, but varies the symbols and headings by topic type.
- Adapts style by topic:
  - SQL topics use query/table/result language.
  - Python topics use code/input/output language.
  - Dashboard topics use KPI/filter/insight language.
  - Excel topics use formula/sheet/report language.
  - ML/AI topics use model/data/evaluation language.
- Does not include image ideas inside the LinkedIn post text.
- Does not add repeated question CTAs.
- Does not add generic `NEXT STEP` endings.
- Keeps hashtags at the end.

## Environment

See `.env.example`.

Required for text generation:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Required for LinkedIn publishing:

```env
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_PERSON_URN=urn:li:person:...
```

Required for OAuth token generation:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost:4000/auth/linkedin/callback
```

## Image Publishing

`POST /api/publish/image` accepts multipart form data:

- `postText`
- `image`

The backend registers the image upload with LinkedIn, uploads the file, then creates a UGC image post.

## Logs

Publish attempts are saved to:

```txt
publish-log.json
```

View from browser:

```txt
http://localhost:4000/api/publish/log
```

## Scheduling

Scheduling uses BullMQ and Redis. Redis is only needed for scheduling.

```cmd
redis-server
```

The current schedule store is in memory. Add a database before production.
