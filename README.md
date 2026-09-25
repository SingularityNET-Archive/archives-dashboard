# Archives Dashboard

A Next.js dashboard and JSON API over the SingularityNET Ambassador Program
meeting archive. Meeting summaries, action items and decisions can be browsed
and searched at `/search`, charted at `/charts`, and queried programmatically
through the API described in [docs/API.md](docs/API.md). The same document is
published on the site at `/docs/api`, rendered at build time from that file, so
edit the markdown to update both.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable                        | Purpose |
|---------------------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (the `meetingsummaries` table must allow anon reads) |
| `SERVER_API_KEY`                | Secret key required by every `/api/*` route. Server-side only. |

`SERVER_API_KEY` must be set in the hosting environment, otherwise every API
call returns `500 server_misconfigured`.

## How data flows

- `lib/meetingSummaries/loader.ts` loads the full dataset from Supabase, pages
  past the row cap, applies the confirmed/unconfirmed dedupe rules and caches
  the result in memory for five minutes.
- `lib/meetingSummaries/search.ts` holds the pure filter, flatten, facet and
  pagination functions.
- The API routes under `pages/api/v1/` and the dashboard pages' 
  `getServerSideProps` both call that module directly, so the dashboard never
  needs the API key in the browser.

## Scripts

| Command         | What it does |
|-----------------|--------------|
| `npm run dev`   | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint`  | ESLint |
