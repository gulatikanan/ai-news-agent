# Product Requirements Document — AI Engineering News Agent

---

## 1. Overview

### 1.1 Product Summary

AI Engineering News is an autonomous newsroom that collects, summarizes, and displays AI/ML engineering news without any human intervention after initial deployment. The system runs on a single OpenClaw gateway with three cron-scheduled LLM sessions that fetch RSS feeds, generate summaries, apply topic tags, and monitor pipeline health every four hours.

### 1.2 Problem Statement

AI/ML engineers need to stay current with a rapidly evolving field, but relevant news is scattered across dozens of sources. Manually curating and summarizing articles is time-consuming and inconsistent. There is no purpose-built, signal-first feed for developers building AI systems.

### 1.3 Goals

| Goal | Metric |
|------|--------|
| Autonomous operation | Zero manual steps after deployment; pipeline self-executes every 4 hours |
| Signal quality | Every article surfaces an AI-generated summary and topic tags |
| Low latency | New articles appear in the frontend within 4 hours of publication |
| Observability | Health alerts delivered via Telegram if pipeline fails or goes stale |
| Cost efficiency | Total infrastructure cost < $0 on free tiers (Supabase, Vercel, Ollama, Azure trial) |

### 1.4 Non-Goals

- Real-time feeds (sub-minute latency)
- User accounts, saved articles, or personalization
- Mobile app
- Paid content or paywalled sources
- Multi-language support

---

## 2. Users

### Primary User

**AI/ML Engineer** — a developer actively building LLM applications, agent systems, or ML infrastructure. They scan headlines during work, want dense signal with minimal noise, and prefer technical framing over general tech journalism.

### Secondary User

**Technical Hiring Manager / Evaluator** — reviewing this project as a take-home assignment. Cares about system design decisions, agent architecture, and engineering judgment.

---

## 3. System Architecture

```
[Azure VPS — Ubuntu 24.04, B2ls v2, 4 GB RAM]
  OpenClaw gateway (systemd daemon, port 18789)
    → boot-md hook: injects BOOT.md system context on every agent session startup
    → command-logger hook: audits all exec tool calls to a log file

    → Agent 1 (cron: 0 */4 * * *)
         → node scripts/run.js
              → collector.js: fetch 3 RSS feeds · filter · deduplicate · upsert to Supabase
              → summarizer.js: articles WHERE summary IS NULL · call Ollama · write summaries
         → Telegram: "Collected N / Summarized M"

    → Agent 2 (cron: 2 */4 * * *)
         → node scripts/tagger.js
              → articles WHERE summary IS NOT NULL AND tags IS NULL
              → call Ollama: categorize into 9 topic tags
              → write tags[] to Supabase
         → Telegram: "Tagged N articles"

    → Agent 3 (cron: 30 */4 * * *)
         → node scripts/healthcheck.js
              → query runs table for last run
              → alert if status = 'error' or age > 5 hours
         → Telegram: HEALTH OK or HEALTH ALERT

         |
         | writes rows
         v

[Supabase — hosted Postgres]
  articles table: id, title, url, source, published_at, summary, tags, created_at
  runs table: id, ran_at, articles_collected, articles_summarized, status, error_msg, duration_ms

         |
         | reads via Supabase JS client (server component, last 5 days)
         v

[Vercel]
  Next.js 15 App Router (force-dynamic)
    / → hero · featured signal · source filters · article grid
```

---

## 4. Agent Design

> **Important:** There is one OpenClaw gateway (a systemd process on the VPS). It is not three separate OpenClaws. The gateway has three cron schedules configured; each schedule fires an independent, isolated LLM session when triggered. Each session completes its task, reports to Telegram, and terminates — no memory persists between firings. These sessions are referred to as Agent 1, 2, and 3 for clarity.

### 4.1 Agent Session 1 — Pipeline Orchestrator (run.js)

**Trigger:** OpenClaw cron, `0 */4 * * *`  
**Session:** Isolated (no memory across firings)  
**LLM:** ministral-3b via Ollama Cloud

The LLM uses the OpenClaw `exec` tool to run `node scripts/run.js`, which internally calls two Node.js scripts in sequence:

**Collector** (`collector.js`):
- Fetches RSS from Hacker News (AI/ML filter), TechCrunch AI, Google News AI
- Filters: title must match AI/ML keyword list; minimum 10 articles per source
- Deduplicates by URL using Supabase upsert with `onConflict: 'url'`
- Writes to `articles` table; logs run metadata to `runs` table

**Summarizer** (`summarizer.js`):
- Queries `articles WHERE summary IS NULL` — NULL column acts as a retry queue
- Calls Ollama `ministral-3b` with a developer-focused prompt
- Writes summary back to Supabase
- Rate limited: 1 article at a time with 500ms delay between calls

**Output:** Telegram message with collected and summarized counts

### 4.2 Agent Session 2 — Tagger (tagger.js)

**Trigger:** OpenClaw cron, `2 */4 * * *` (2 min after Agent 1)  
**Session:** Isolated  
**LLM:** ministral-3b via Ollama Cloud

- Queries `articles WHERE summary IS NOT NULL AND tags IS NULL`
- Sends each summary to Ollama for classification into 9 tags: `llm`, `agents`, `open-source`, `research`, `tools`, `industry`, `hardware`, `security`, `data`
- Writes `tags text[]` array back to Supabase
- Runs after Agent 1 because it depends on summaries being present

**Inter-agent coordination:** Agents do not call each other. They coordinate through Supabase state — NULL fields signal pending work. This is the [blackboard pattern](https://en.wikipedia.org/wiki/Blackboard_(design_pattern)).

### 4.3 Agent Session 3 — Health Monitor (healthcheck.js)

**Trigger:** OpenClaw cron, `30 */4 * * *` (30 min after Agent 1)  
**Session:** Isolated  
**LLM:** ministral-3b via Ollama Cloud

- Queries `runs` table for the most recent pipeline run
- Raises HEALTH ALERT if:
  - `status = 'error'` — pipeline crashed
  - `ran_at` older than 5 hours — pipeline stopped running
- Reports collected/summarized counts and duration on success

**Output:** Telegram message: `HEALTH OK` or `HEALTH ALERT` with diagnostic details

### 4.4 OpenClaw Hooks

| Hook | Trigger | Effect |
|------|---------|--------|
| `boot-md` | Every agent session start | Injects `BOOT.md` system context — tells LLM which scripts exist, what they do, and what tools to use |
| `command-logger` | Every exec tool call | Appends timestamp + command to audit log on VPS |

### 4.5 OpenClaw Skill — news-pipeline

An interactive skill installed in the OpenClaw workspace. When the user sends a pipeline monitoring question to the Telegram bot (e.g. "Is the pipeline healthy?"), the LLM uses this skill to run Node.js one-liners that query Supabase directly and return live data.

---

## 5. Data Model

### 5.1 articles

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| title | text | Article headline |
| url | text | Unique — used for deduplication |
| source | text | `hackernews`, `techcrunch-ai`, `google-news` |
| published_at | timestamptz | From RSS feed |
| summary | text | AI-generated; NULL until summarizer runs |
| tags | text[] | AI-generated; NULL until tagger runs |
| created_at | timestamptz | Row insertion time |

### 5.2 runs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| ran_at | timestamptz | Pipeline execution timestamp |
| articles_collected | int | Upserted in this run |
| articles_summarized | int | Summarized in this run |
| status | text | `success` or `error` |
| error_msg | text | Populated on failure |
| duration_ms | int | Total pipeline duration |

### 5.3 Access

The cron-scheduled agent sessions and the Next.js frontend both use the **Supabase service role key** — this grants full admin access and bypasses Row Level Security. Appropriate for a single-tenant autonomous system with no end-user auth.

---

## 6. Frontend Requirements

### 6.1 Page Structure

- **Header (sticky):** Logo · source filter tabs · dark/light mode toggle · reading progress bar
- **Hero section:** Live article count · last updated time · sources count · pipeline run count · animated ambient orbs
- **Featured Signal card:** Top editorial pick with full summary, "Why this matters" pull-quote, AI topic tags, neural-net SVG illustration
- **Latest Signals grid:** Responsive `auto-fill` columns, min 300px, all remaining articles
- **Footer:** Attribution links (Ollama, Supabase, OpenClaw, Next.js)

### 6.2 Article Card Features

- Source badge (colour-coded per outlet)
- `NEW` badge for articles published in the last 24 hours
- AI-generated summary (line-clamped to 4 lines)
- "Why this matters" pull-quote (last meaningful sentence of summary)
- AI topic tags from Supabase (fallback: client-side keyword matching)
- Hover: lift + border glow effect
- "View Article" button — opens original URL in new tab

### 6.3 Interactivity

| Feature | Description |
|---------|-------------|
| Dark / Light mode | Toggle in header; dark is default |
| Source filter tabs | All · Hacker News · TechCrunch · Google News |
| Keyboard navigation | `J` / `K` moves between articles; `O` / Enter opens in new tab |
| Reading progress bar | Fixed top bar, fills as user scrolls |
| Filter animation | 150ms opacity fade on source switch |

### 6.4 Data Fetching

- Next.js App Router **server component** with `export const dynamic = 'force-dynamic'`
- Supabase JS client called server-side — credentials never exposed to browser
- Fetches last 5 days of articles, ordered by `published_at DESC`
- `runCount` from `runs` table passed as prop to client components

---

## 7. Infrastructure Requirements

### 7.1 VPS (Azure)

| Requirement | Value | Reason |
|-------------|-------|--------|
| OS | Ubuntu Server 24.04 LTS | LTS for stability; OpenClaw requires Linux |
| Size | Standard B2ls v2 (2 vCPU, 4 GB RAM) | OpenClaw `npm install` OOM-kills on 1 GB |
| Node.js | v22.12+ | OpenClaw minimum requirement |
| Persistent process | systemd daemon | Keeps OpenClaw gateway alive across reboots |
| Inbound ports | SSH (22) only | No public web exposure needed |

### 7.2 Supabase

- Free tier (500 MB storage, 2 GB bandwidth)
- Hosted Postgres — no self-managed database
- Service role key used by all agents

### 7.3 Vercel

- Free tier (Hobby plan)
- Auto-deploys on push to `main`
- Root directory: `frontend/`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 7.4 Ollama Cloud

- API key from [ollama.com/settings/keys](https://ollama.com/settings/keys)
- Model: `ministral-3b` — small, fast, free tier
- Called directly by `summarizer.js` and `tagger.js` via HTTP

---

## 8. Observability and Monitoring

### 8.1 Telegram Alerts

Each of the three cron sessions sends a Telegram message after every run:

| Session | Message |
|---------|---------|
| Session 1 (run.js) | Collected N articles, summarized M |
| Session 2 (tagger.js) | Tagged N articles |
| Session 3 (healthcheck.js) | HEALTH OK (last run age + counts) or HEALTH ALERT (status + error details) |

### 8.2 Health Check Logic (Session 3)

- HEALTH ALERT conditions:
  - Last run `status = 'error'`
  - Last `ran_at` more than 5 hours ago (expected cadence: every 4 hours)
- Queries last 3 runs for context
- Exits with code 1 on database query failure

### 8.3 Command Audit Log

The `command-logger` OpenClaw hook writes every `exec` tool call to a log file on the VPS. This provides a full audit trail of what commands the LLM ran.

### 8.4 OpenClaw Logs

```bash
openclaw logs --follow    # stream live agent execution
```

Available on the VPS. Shows LLM reasoning, tool calls, and output for every agent session.

---

## 9. Security Considerations

- VPS has no public-facing ports beyond SSH; no web server exposed
- SSH auth via `.pem` key only — no password auth
- Supabase service role key stored in `.env` on VPS (not committed to Git; listed in `.gitignore`)
- Frontend reads Supabase via server component — service role key never sent to browser
- OpenClaw gateway runs as the `azureuser` OS user; agents cannot escalate privileges without explicit elevated tools config

---

## 10. Cost Model

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Azure VPS (B2ls v2) | Free trial ($200 credit) | ~$30/mo after trial |
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| Ollama Cloud (ministral-3b) | Free tier | $0 |
| OpenClaw | Free | $0 |
| **Total (trial period)** | | **$0** |

---

## 11. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Agent runtime | OpenClaw | 2026.5.7 |
| LLM | Ollama Cloud — ministral-3b | — |
| Messaging | Telegram Bot API | — |
| Database | Supabase (hosted Postgres) | — |
| RSS parsing | rss-parser (npm) | — |
| Frontend framework | Next.js App Router | 15 |
| Frontend styling | Tailwind CSS + inline styles | — |
| Frontend hosting | Vercel | — |
| Compute | Azure B2ls v2, Ubuntu 24.04 | — |
| Process manager | systemd | — |

---

## 12. Future Improvements

| Item | Priority | Notes |
|------|----------|-------|
| More RSS sources | Medium | Reddit r/MachineLearning, arXiv, The Batch |
| Deduplication across sources | Medium | Same story from multiple outlets |
| Article quality scoring | Medium | Rank by engagement or recency |
| User-facing search | Low | Full-text search via Supabase |
| Persistent dark/light preference | Low | localStorage |
| Bigger LLM for summarization | Low | llama3 or mistral-7b for higher quality |
| Retry on Ollama failure | Medium | Currently skips; should retry next run |
| Slack / Discord channel support | Low | OpenClaw supports multiple channels |
| Summary caching / CDN | Low | ISR instead of force-dynamic |
| Tag filter in frontend | Medium | Filter grid by topic tag |
