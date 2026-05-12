# AI News Agent

An autonomous newsroom that collects, summarizes, and displays AI/ML engineering news.

Built with OpenClaw · Supabase · Next.js · Vercel · Ollama

**Live URL:** https://ai-news-agent-black.vercel.app

---

## Architecture

```
[Azure VPS — North Europe, B2ls v2]
  OpenClaw gateway (systemd daemon, port 18789)
    → boot-md hook: injects BOOT.md system context into every agent session on startup
    → command-logger hook: logs all agent exec commands to audit file

    → OpenClaw cron job 1 (0 */4 * * *) → OpenClaw agent 1 (ollama/ministral-3b)
         → node scripts/run.js
              → collector: polls 3 RSS feeds · filters · deduplicates · upserts to Supabase
              → summarizer: reads summary IS NULL · calls Ollama · writes summaries back
         → Telegram message 1: collected/summarized counts

    → OpenClaw cron job 2 (2 */4 * * *) → OpenClaw agent 2 (ollama/ministral-3b)
         → node scripts/tagger.js
              → reads articles with summary but no tags
              → calls Ollama: categorize into [llm, agents, open-source, research, tools, industry, hardware, security, data]
              → writes tags array to Supabase
         → Telegram message 2: tagged count

        |
        | writes rows
        v

[Supabase — hosted Postgres]
  articles table
    id, title, url, source, published_at, summary, tags, created_at
  runs table
    id, ran_at, articles_collected, articles_summarized, status, error_msg, duration_ms

        |
        | reads via Supabase JS client (server component, last 5 days)
        v

[Vercel]
  Next.js App Router
    / → AI-native news feed: hero · featured signal · source filters · article grid
```

---

## Agent Design

The pipeline uses two OpenClaw cron agents cooperating through Supabase:

| OpenClaw Agent | Cron | Script | Responsibility |
|---|---|---|---|
| Agent 1 | `0 */4 * * *` | `run.js` | Orchestrates collector + summarizer in sequence |
| Agent 2 | `2 */4 * * *` | `tagger.js` | Reads summarized articles · calls Ollama · writes tags |

Within Agent 1, two internal agents run in sequence:

| Internal Agent | File | Responsibility |
|---|---|---|
| Collector | `scripts/collector.js` | Fetch RSS · filter · deduplicate · upsert to Supabase |
| Summarizer | `scripts/summarizer.js` | Read unsummarized articles · call Ollama · write summaries |

**OpenClaw Hooks enabled:**
| Hook | Purpose |
|---|---|
| `boot-md` | Injects `BOOT.md` system context into every agent session on gateway startup |
| `command-logger` | Logs all agent exec commands to a centralized audit file |

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
  - AI-generated topic tags from Supabase (set by tagger agent, falls back to client-side keyword matching)
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
│   │   ├── collector.js       # RSS fetch, filter, upsert to Supabase
│   │   ├── summarizer.js      # Summarize unsummarized articles via Ollama
│   │   ├── tagger.js          # AI tag generation — called by OpenClaw Agent 2
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
├── .gitignore
└── README.md
```

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository foundation — folders, gitignore, README | Done |
| 2 | Supabase schema — articles table, test connection | Done |
| 3 | VPS provisioning — Azure B2ls v2 VM (4 GB), Node.js 22 | Done |
| 4 | OpenClaw setup — installed on VPS, two-agent pipeline | Done |
| 5 | RSS ingestion — fetch, filter, deduplicate, summarize via Ollama | Done |
| 6 | OpenClaw integration — gateway daemon, Telegram pairing, cron every 4 hours | Done |
| 7 | Next.js frontend — premium AI-native UI, dark mode, featured signal | Done |
| 8 | Vercel deployment — live at ai-news-agent-black.vercel.app | Done |
| 9 | README polish — full redeploy instructions | Done |

---

## Setup

### Prerequisites

- Supabase project created (free tier)
- Ollama cloud API key — [ollama.com/settings/keys](https://ollama.com/settings/keys)
- Vercel account connected to this GitHub repo
- Node.js 22+ on VPS (OpenClaw requires 22.12+)

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
node scripts/tagger.js       # tag only
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
- Size: Standard B2ls v2 (2 vCPU, 4 GiB RAM) — OpenClaw npm install OOM-kills on 1 GB, 4 GB required
- Image: Ubuntu Server 24.04 LTS
- Auth: SSH public key
- Inbound ports: SSH (22)

#### 2. Connect via SSH
```bash
ssh -i /path/to/key.pem azureuser@YOUR_VM_PUBLIC_IP
```

#### 3. Install Node.js 22 (OpenClaw requires 22.12+)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # must show v22.x.x
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

#### 6. Install OpenClaw and run onboarding
```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
openclaw onboard --install-daemon
```

At each prompt: provider = Ollama, base URL = `https://api.ollama.com`, model = `ministral-3b`, channel = Telegram (paste your bot token from @BotFather), install as daemon = yes.

After onboarding, enable elevated tools in `~/.openclaw/openclaw.json`:
```json
"tools": { "elevated": { "enabled": true } }
```
Then restart: `openclaw gateway restart`

#### 7. Pair your Telegram account
Send any message to your bot → it replies with a code → run:
```bash
openclaw pairing approve telegram YOUR_CODE
```

#### 8. Add tags column to Supabase

In your Supabase dashboard → SQL Editor, run:
```sql
alter table articles add column if not exists tags text[];
```

#### 9. Enable OpenClaw hooks
```bash
openclaw hooks enable boot-md
openclaw hooks enable command-logger
```

Create the BOOT.md context file:
```bash
nano ~/.openclaw/workspace/BOOT.md
```

Paste this content:
```markdown
# AI News Agent — System Context

You are the AI agent for an autonomous news collection system that collects and summarizes AI/ML engineering news every 4 hours.

## Pipeline Scripts

All scripts are in `/home/azureuser/ai-news-agent/openclaw/scripts/`

- `run.js` — Orchestrator: runs collector then summarizer in sequence
- `collector.js` — Fetches RSS feeds → inserts into Supabase
- `summarizer.js` — Reads articles without summaries → calls Ollama → writes summaries
- `tagger.js` — Reads summarized articles without tags → calls Ollama → writes tags

## When Running Scripts

Always use the exec tool with workdir `/home/azureuser/ai-news-agent/openclaw`. Never use sudo.

## Reporting

After every script run, report: articles collected/summarized/tagged, any errors, and total duration.
```

Save with Ctrl+O → Enter → Ctrl+X. Then restart:
```bash
openclaw gateway restart
```

#### 10. Schedule both OpenClaw cron agents

Agent 1 — main pipeline (collector + summarizer):
```bash
openclaw cron add --name "ai-news-pipeline" --cron "0 */4 * * *" --session isolated --announce --channel telegram --to "YOUR_TELEGRAM_CHAT_ID" --message "Use the exec tool to run this exact command: node scripts/run.js in workdir /home/azureuser/ai-news-agent/openclaw. Do not use sudo. Just run that command and report the output."
```

Agent 2 — tagger (runs 2 minutes after Agent 1):
```bash
openclaw cron add --name "tagger-agent" --cron "2 */4 * * *" --session isolated --announce --channel telegram --to "YOUR_TELEGRAM_CHAT_ID" --message "Use the exec tool to run this exact command: node scripts/tagger.js in workdir /home/azureuser/ai-news-agent/openclaw. Do not use sudo. Just run that command and report the output."
```

Test both immediately:
```bash
openclaw cron list                     # note both job IDs
openclaw cron run <agent1-job-id>
openclaw cron run <agent2-job-id>
openclaw logs --follow                 # watch execution
```

You will receive two Telegram messages — one from each agent.

#### 11. Check logs
```bash
openclaw logs --follow
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent runtime | OpenClaw 2026.5.7 (gateway + cron, systemd daemon) |
| LLM | Ollama Cloud — `ministral-3b` |
| Channel | Telegram bot (@Aipublication_bot) |
| Database | Supabase (free tier — hosted Postgres) |
| Frontend | Next.js 15 App Router, Tailwind CSS |
| Hosting | Vercel (free tier) |
| Compute | Azure B2ls v2 VM (2 vCPU, 4 GB RAM, free trial) |
