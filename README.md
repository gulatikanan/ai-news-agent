# AI News Agent

An autonomous newsroom that collects, summarizes, and displays AI/ML engineering news.

Built with OpenClaw · Supabase · Next.js · Vercel · Ollama

**Live URL:** https://ai-news-agent-black.vercel.app

---

## Architecture

```
[Azure VPS — North Europe, B2ts v2]
  cron (every 4 hours) → node scripts/run.js

  run.js (orchestrator)
    → collector agent
        → polls 3 RSS feeds: Google News · Hacker News · TechCrunch AI
        → HN-only: keyword filter — only AI/ML relevant articles pass
        → skips articles older than 7 days
        → deduplicates by URL (Supabase upsert, conflict on url)
        → writes raw articles to Supabase
    → summarizer agent
        → queries Supabase for articles where summary IS NULL
        → calls Ollama cloud API (Ministral 3B) per article
        → try/catch: Ollama failure skips that article, run continues
        → writes summaries back to Supabase
    → logs all output to ~/ingest.log

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

---

## Agent Design

The pipeline uses two cooperating agents built on the OpenClaw runtime:

| Agent | File | Responsibility |
|---|---|---|
| Collector | `scripts/collector.js` | Fetch RSS · filter · deduplicate · upsert to Supabase |
| Summarizer | `scripts/summarizer.js` | Read unsummarized articles · call Ollama · write summaries |

Both agents extend the `Agent` base class in `lib/agent.js`. The orchestrator (`run.js`) runs them in sequence — collector first, then summarizer picks up whatever was just inserted.

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
│   ├── lib/
│   │   └── agent.js           # Agent base class built on OpenClaw runtime
│   ├── scripts/
│   │   ├── run.js             # Orchestrator — runs collector then summarizer
│   │   ├── collector.js       # Agent 1 — RSS fetch, filter, upsert to Supabase
│   │   ├── summarizer.js      # Agent 2 — summarize unsummarized articles via Ollama
│   │   └── ingest.js          # Legacy single-script pipeline (reference)
│   ├── .env.example           # Required environment variables
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
│   └── schema.sql             # Articles table schema
├── docs/                      # Architecture notes
├── .gitignore
└── README.md
```

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository foundation — folders, gitignore, README | Done |
| 2 | Supabase schema — articles table, test connection | Done |
| 3 | VPS provisioning — Azure B2ts v2 VM, Node.js 20 | Done |
| 4 | OpenClaw setup — installed on VPS, two-agent pipeline | Done |
| 5 | RSS ingestion — fetch, filter, deduplicate, summarize via Ollama | Done |
| 6 | Cron scheduling — every 4 hours, logs to ingest.log | Done |
| 7 | Next.js frontend — premium AI-native UI, dark mode, featured signal | Done |
| 8 | Vercel deployment — live at ai-news-agent-black.vercel.app | Done |
| 9 | README polish — full redeploy instructions | Done |

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
node scripts/run.js
```

Runs the full two-agent pipeline: collector fetches and upserts articles, summarizer picks up any with missing summaries. Existing articles are skipped (deduplication by URL).

To run a single agent:
```bash
node scripts/collector.js    # fetch + upsert only
node scripts/summarizer.js   # summarize only
```

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

### VPS Deployment (Azure)

#### 1. Provision a VM
- Provider: Azure (free trial — $200 credit)
- Size: Standard B2ts v2 (2 vCPU, 1 GiB) — ~$8/month
- Image: Ubuntu Server 24.04 LTS
- Auth: SSH public key
- Inbound ports: SSH (22)

#### 2. Connect via SSH
```bash
ssh -i /path/to/key.pem azureuser@YOUR_VM_PUBLIC_IP
```

#### 3. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. Clone and configure
```bash
git clone https://github.com/gulatikanan/ai-news-agent.git
cd ai-news-agent/openclaw
npm install
nano .env   # paste your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OLLAMA_API_KEY
```

#### 5. Test the pipeline
```bash
node scripts/run.js
```

Should print collector and summarizer output ending with `=== done ===`.

#### 6. Set up cron (every 4 hours)
```bash
crontab -e
```
Add this line:
```
0 */4 * * * cd /home/azureuser/ai-news-agent/openclaw && node scripts/run.js >> /home/azureuser/ingest.log 2>&1
```

#### 7. Check logs
```bash
tail -f ~/ingest.log
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent runtime | OpenClaw (npm) |
| LLM | Ollama cloud API — Ministral 3B |
| Database | Supabase (free tier — hosted Postgres) |
| Frontend | Next.js App Router, Tailwind CSS |
| Hosting | Vercel (free tier) |
| Compute | Azure B2ts v2 VM (free trial) |
