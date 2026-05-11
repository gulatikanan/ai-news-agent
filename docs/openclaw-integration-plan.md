# OpenClaw Integration Plan

## What we are doing and why

The assignment requires OpenClaw running on the VPS as the agent runtime.
OpenClaw is a personal AI gateway — you run it on a server, connect it to an LLM,
and it becomes an AI assistant that can execute tasks on a schedule.

Our goal:
1. Get OpenClaw gateway running on the Azure VPS
2. Pair a Telegram channel so the agent can respond to prompts
3. Schedule the news pipeline to run through OpenClaw every 4 hours

After this, the flow will be:

```
OpenClaw gateway (running on VPS as a systemd daemon)
  └─ OpenClaw cron (every 4 hours)
       └─ OpenClaw agent (AI + exec tool)
            └─ runs: node scripts/run.js
                 ├─ collector agent → RSS → Supabase
                 └─ summarizer agent → Ollama → Supabase
```

This satisfies: "populated by a scheduled OpenClaw run on the VPS" ✅

---

## Before you start — things to have ready

- [ ] Your Telegram app on your phone (you need this to create a bot)
- [ ] Your Ollama API key (already in your `.env` file on VPS)
- [ ] SSH access to your Azure VM ready (the `.pem` key + IP address)

---

## Phase 1 — Upgrade Node.js on VPS

OpenClaw requires Node 22.12 or higher. Our VPS has Node 20. This must be done first.

**SSH into your VPS:**
```bash
ssh -i /path/to/your-key.pem azureuser@YOUR_VM_IP
```

**Run this on the VPS:**
```bash
node --version
```
You should see `v20.x.x`. Now upgrade:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify:**
```bash
node --version
```
Must show `v22.x.x` before continuing. If it still shows v20, log out and back in.

**Make sure our existing pipeline still works after the upgrade:**
```bash
cd ~/ai-news-agent/openclaw
node scripts/run.js
```
Should print the same collector + summarizer output as before. If it does, Node upgrade is clean.

---

## Phase 2 — Create a Telegram Bot (5 minutes, on your phone)

OpenClaw needs a messaging channel to "pair a device." Telegram is the easiest.

1. Open Telegram on your phone
2. Search for **@BotFather** and open that chat
3. Send: `/newbot`
4. BotFather asks: *"What name do you want for your bot?"*
   - Type anything, e.g. `AI News Agent`
5. BotFather asks: *"What username?"*
   - Must end in `bot`, e.g. `ainewsagent_bot`
6. BotFather replies with your **bot token** — looks like:
   ```
   7123456789:AAGf8Kx9Ld2_someRandomString_here
   ```
7. **Copy and save this token** — you will paste it during OpenClaw onboarding

---

## Phase 3 — Install OpenClaw on the VPS

Still in your SSH session:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

This installs the OpenClaw CLI. Wait for it to complete.

**Verify installation:**
```bash
openclaw --version
```
Should print a version number. If you get `command not found`, run:
```bash
source ~/.bashrc
openclaw --version
```

---

## Phase 4 — Run OpenClaw Onboarding

This is the interactive wizard. Read each prompt carefully and follow this guide.

```bash
openclaw onboard --install-daemon
```

The wizard walks through several steps. Here is exactly what to choose at each one:

### Step 1 — Model provider
When asked to choose a model provider, select **Ollama**.
When asked for the Ollama API key, paste your Ollama API key.
When asked for model, type: `ministral-3b` (same model we use in summarizer.js)

### Step 2 — Workspace
Accept the default location (`~/.openclaw/workspace`). Just press Enter.

### Step 3 — Gateway settings
- Port: press Enter (default 18789 is fine)
- Bind: press Enter (default loopback is fine)
- Auth: press Enter (keep token auth enabled)

### Step 4 — Channels
When asked about channels, select **Telegram**.
Paste the bot token you copied from BotFather in Phase 2.
Follow any additional prompts for Telegram setup.

### Step 5 — Daemon install
When asked about installing as a daemon, choose **yes** (installs as systemd service so it auto-starts on reboot).

### Step 6 — Health check
The wizard runs a health check. Wait for it to pass.

---

## Phase 5 — Verify the Gateway is Running

```bash
openclaw gateway status
```

Should show: Gateway listening on port 18789.

If it is not running:
```bash
openclaw gateway start
```

---

## Phase 6 — Test: Have the Agent Respond to a Prompt

1. Open Telegram on your phone
2. Search for your bot by the username you created (e.g. `@ainewsagent_bot`)
3. Start a chat and send: `hello`
4. The bot should reply with an AI-generated response

If it replies — this satisfies **"Have one agent respond to a prompt"** ✅

If it does not reply within 30 seconds:
```bash
openclaw logs --follow
```
Check for errors. The most common issue is an incorrect bot token — re-run `openclaw onboard` and re-enter the Telegram token.

---

## Phase 7 — Schedule the News Pipeline via OpenClaw Cron

Now we connect OpenClaw to our news pipeline. We will use OpenClaw's built-in cron scheduler to run our pipeline every 4 hours.

**First, remove the old Linux cron job** (so we don't double-run):
```bash
crontab -e
```
Delete the line that has `node scripts/run.js`. Save and exit.

**Add the OpenClaw cron job:**
```bash
openclaw cron add \
  --name "ai-news-pipeline" \
  --cron "0 */4 * * *" \
  --session isolated \
  --message "Run the AI news collection pipeline. Execute the command: cd /home/azureuser/ai-news-agent/openclaw && node scripts/run.js and report how many articles were collected and summarized."
```

**Verify the job was added:**
```bash
openclaw cron list
```
You should see `ai-news-pipeline` in the list with a `0 */4 * * *` schedule.

---

## Phase 8 — Test the Cron Job Runs Correctly

Force a manual run right now (do not wait 4 hours):
```bash
openclaw cron run <jobId>
```
Replace `<jobId>` with the ID shown in `openclaw cron list`.

Check the result:
```bash
openclaw cron runs --id <jobId> --limit 5
```

You should see a completed run with output showing articles collected and summarized.

You can also watch the logs live:
```bash
openclaw logs --follow
```

---

## Phase 9 — Update the Log File

Now that OpenClaw manages the cron, update the log path to use OpenClaw's log system:
```bash
openclaw logs
```

If you still want to keep a separate log file, you can redirect from inside the message — but OpenClaw's built-in logging is sufficient.

---

## Phase 10 — Verify Everything End to End

Run this checklist:

- [ ] `openclaw gateway status` → shows running on port 18789
- [ ] `openclaw cron list` → shows `ai-news-pipeline` scheduled every 4 hours
- [ ] Telegram bot replies to your message
- [ ] `openclaw cron runs --id <jobId>` → shows at least one successful run
- [ ] Supabase `runs` table has a new row from the OpenClaw-triggered run
- [ ] `https://ai-news-agent-black.vercel.app` shows updated article count and pipeline run count

---

## What changes in the README after this

Once done, update the README to say:

- Agent runtime: **OpenClaw** (gateway running as systemd daemon on Azure VPS)
- Scheduling: **OpenClaw cron** (`0 */4 * * *`)
- Channel: **Telegram** (agent responds to prompts)

---

## Rollback plan if something breaks

If OpenClaw causes problems and the pipeline stops working:

1. Re-add the Linux cron job:
   ```bash
   crontab -e
   # Add back: 0 */4 * * * cd /home/azureuser/ai-news-agent/openclaw && node scripts/run.js >> /home/azureuser/ingest.log 2>&1
   ```
2. The pipeline runs independently of OpenClaw — removing the OpenClaw cron does not break anything else.

---

## Time estimate

| Phase | Time |
|-------|------|
| Phase 1 — Node upgrade | 5 min |
| Phase 2 — Create Telegram bot | 5 min |
| Phase 3 — Install OpenClaw | 5 min |
| Phase 4 — Onboarding wizard | 10-15 min |
| Phase 5-6 — Verify gateway + Telegram | 5 min |
| Phase 7-8 — Schedule + test cron | 5 min |
| **Total** | **~35-40 min** |
