# AI News Agent

An autonomous newsroom that collects, summarizes, and displays AI/ML engineering news.

Built with OpenClaw · Supabase · Next.js · Vercel · Ollama

**Live URL:** https://ai-news-agent-black.vercel.app

---

## Architecture

```
[Azure VPS]  ← Phase 3/4/6 in progress
  cron (every 4 hours) → node scripts/ingest.js

  ingest.js
    → polls 3 RSS feeds: Google News · Hacker News · TechCrunch AI
    → HN-only: keyword filter — only AI/ML relevant articles pass
    → skips articles older than 7 days
    → deduplicates by URL (Supabase upsert, conflict on url)
    → calls Ollama cloud API (Ministral 3B) to summarize each new article
    → try/catch: Ollama failure skips that article, ingestion continues
    → writes articles + summaries to Supabase

        |
        | writes rows
        v

[Supabase — hosted Postgres]
  articles table
    id, title, url, source, published_at, summary, created_at

        |
        | reads via Supabase JS client (server component, last 5 days)
        v

[Vercel]
  Next.js App Router
    / → AI-native news feed: hero · featured signal · source filters · article grid
```

> **Current status:** Ingestion pipeline runs and Vercel frontend is live. VPS cron scheduling (phases 3–6) is in progress.

---

## Frontend Features

- **Dark / light mode** — toggle in header, persists per session
- **Source filter tabs** — All · Hacker News · TechCrunch · Google News
- **Reading progress bar** — fixed top bar fills as you scroll
- **Keyboard navigation** — `J` / `K` moves between articles, `O` / `Enter` opens in new tab
- **Hero section** — animated ambient orbs, live article count, sources badge, last-updated time
- **Featured Signal card** — top editorial pick with full summary, tags, neural-net SVG illustration
- **Article grid** — responsive `auto-fill` columns, min 300 px
- **Per-card features:**
  - Source badge (colour-coded per outlet)
  - `NEW` badge for articles published in the last 24 h
  - AI-generated summary (line-clamped to 4 lines)
  - "Why this matters" pull-quote (last sentence of summary, highlighted)
  - Auto-generated topic tags (`#llm`, `#agents`, `#rag`, etc.) from title + summary
  - Hover: lift + border glow
- **Empty state** — shown when a filtered source has no articles yet

---

## Repository Structure

```
ai-news-agent/
├── openclaw/
│   ├── scripts/
│   │   └── ingest.js        # RSS fetch + AI summarization pipeline
│   ├── .env.example         # Required environment variables
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── PageContent.js     # Client orchestrator — theme, filters, keyboard nav
│   │   │   ├── Hero.js            # Hero section with ambient effects + live stats
│   │   │   ├── FeaturedArticle.js # Editorial featured signal card + SVG illustrations
│   │   │   └── ArticleCard.js     # Article card with tags + "Why this matters"
│   │   ├── lib/
│   │   │   └── utils.js           # Tag generation, markdown stripping, relative time
│   │   ├── page.js                # Server component — fetches last 5 days from Supabase
│   │   ├── layout.js
│   │   └── globals.css            # Keyframe animations: fadeInUp, orbFloat, pulseDot
│   └── package.json
├── supabase/
│   └── schema.sql           # Articles table schema
├── docs/                    # Architecture notes
├── .gitignore
└── README.md
```

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository foundation — folders, gitignore, README | Done |
| 2 | Supabase schema — articles table, test connection | Done |
| 3 | VPS provisioning — Azure B1s VM, install Node.js | Pending |
| 4 | OpenClaw setup — install on VPS, run gateway | Pending |
| 5 | RSS ingestion — fetch, filter, deduplicate, summarize via Ollama | Done |
| 6 | Cron scheduling — every 4 hours, automatic pipeline | Pending |
| 7 | Next.js frontend — premium AI-native UI, dark mode, featured signal | Done |
| 8 | Vercel deployment — live at ai-news-agent-black.vercel.app | Done |
| 9 | README polish — full VPS redeploy instructions | Pending |

---

## Setup

### Prerequisites

- Supabase project created (free tier)
- Ollama cloud API key — [ollama.com/settings/keys](https://ollama.com/settings/keys)
- Vercel account connected to this GitHub repo
- Node.js 20+ (local or VPS)

### Environment Variables

**`openclaw/.env`**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OLLAMA_API_KEY=your-ollama-api-key
```

**`frontend/.env.local`** (also set as Vercel environment variables)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running the Pipeline Locally

```bash
cd openclaw
npm install
node scripts/ingest.js
```

The script fetches all three feeds, upserts new articles to Supabase, then calls Ollama to summarize each new article. Existing articles are skipped (deduplication by URL). Ollama failures are caught per-article — the rest of the run continues.

### Running the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Requires `frontend/.env.local` with Supabase credentials. Opens at `http://localhost:3000`.

### Deploying the Frontend to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel → set **Root Directory** to `frontend`.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Vercel environment variables.
4. Deploy — Vercel auto-deploys on every push to `main`.

### VPS + Cron Setup (in progress)

Full instructions will be added in Phase 9 once OpenClaw is running on the Azure VM and the cron job is confirmed stable.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent runtime | OpenClaw (npm) |
| LLM | Ollama cloud API — Ministral 3B |
| Database | Supabase (free tier — hosted Postgres) |
| Frontend | Next.js App Router, Tailwind CSS |
| Hosting | Vercel (free tier) |
| Compute | Azure B1s VM (free trial) |
