# AI News Agent

An autonomous newsroom that collects, summarizes, and displays AI/ML industry news.

Built with OpenClaw (agent runtime) · Supabase (database) · Next.js + Vercel (frontend) · Ollama (LLM)

---

## Architecture

```
[VPS]
  OpenClaw agent
    → polls Google News RSS + Hacker News API
    → deduplicates by URL
    → writes articles to Supabase

  cron (every 4 hours) → triggers pipeline

        |
        | writes rows
        v

[Supabase]
  articles table
    id, title, url, source, published_at, created_at

        |
        | reads via Supabase JS client
        v

[Vercel]
  Next.js 15 (App Router)
    / → article list
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
| 3 | VPS provisioning — create VM, install Node.js | Pending |
| 4 | OpenClaw setup — install on VPS, run gateway, hello-world | Pending |
| 5 | RSS ingestion — fetch articles, deduplicate, write to Supabase | Done |
| 6 | Cron scheduling — crontab entry, every 4 hours, logging | Pending |
| 7 | Next.js frontend — article list, Tailwind CSS | Pending |
| 8 | Vercel deployment — connect repo, set env vars, live URL | Pending |
| 9 | README polish — full redeploy instructions | Pending |

---

## Setup Checklist

### Prerequisites
- [ ] VPS provisioned (Oracle Always-Free / DigitalOcean / AWS)
- [ ] Supabase project created
- [ ] Ollama installed and accessible on VPS
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
| LLM | Ollama runtime |
| Database | Supabase (free tier) |
| Frontend | Next.js 15, Tailwind CSS |
| Hosting | Vercel (free tier) |
| Compute | VPS with free-credit cloud provider |
