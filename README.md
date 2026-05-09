# AI News Agent

An autonomous newsroom that collects, summarizes, and displays AI/ML industry news.

Built with OpenClaw (agent runtime) · Supabase (database) · Next.js + Vercel (frontend) · Ollama (LLM)

---

## Architecture

```
[VPS]
  cron (every 4 hours) → triggers ingest.js

  ingest.js
    → polls Google News RSS + Hacker News API + TechCrunch
    → deduplicates by URL
    → writes new articles to Supabase
    → calls Ollama cloud API (Ministral 3B) to summarize each new article
    → writes summary back to Supabase

        |
        | writes rows
        v

[Supabase]
  articles table
    id, title, url, source, published_at, summary, created_at

        |
        | reads via Supabase JS client
        v

[Vercel]
  Next.js 15 (App Router)
    / → article list with summaries
```

---

## Repository Structure

```
ai-news-agent/
├── openclaw/       # OpenClaw agent code (runs on VPS)
├── frontend/       # Next.js app (deployed to Vercel)
├── docs/           # Architecture notes and setup references
├── .env.example    # Required environment variables (to be added)
├── .gitignore
└── README.md
```

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository foundation — folders, gitignore, README | Done |
| 2 | Supabase schema — create articles table, test connection | Done |
| 3 | VPS provisioning — Azure VM, install Node.js | Pending |
| 4 | OpenClaw setup — install on VPS, run gateway, hello-world | Pending |
| 5 | RSS ingestion — fetch, deduplicate, summarize via Ollama, write to Supabase | Done |
| 6 | Cron scheduling — crontab entry, every 4 hours, logging | Pending |
| 7 | Next.js frontend — article list, Tailwind CSS | Done |
| 8 | Vercel deployment — connect repo, set env vars, live URL | Done |
| 9 | README polish — full redeploy instructions | Pending |

---

## Setup Checklist

### Prerequisites
- [ ] VPS provisioned (Azure free trial — B1s Ubuntu VM)
- [ ] Supabase project created
- [ ] Ollama cloud API key (ollama.com/settings/keys)
- [ ] Vercel account connected to GitHub repo
- [ ] Node.js 20+ installed on VPS

### Environment Variables
Copy `.env.example` to `.env` and fill in all values before running any agent.

### Deploying from Scratch
> Full redeploy instructions will be added here once all phases are complete.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent runtime | OpenClaw (npm) |
| LLM | Ollama cloud API (Ministral 3B) |
| Database | Supabase (free tier) |
| Frontend | Next.js 15, Tailwind CSS |
| Hosting | Vercel (free tier) |
| Hosting | Vercel (free tier) — https://ai-news-agent-black.vercel.app |
| Compute | Azure B1s VM (free trial) |
