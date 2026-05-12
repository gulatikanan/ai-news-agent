---
name: news-pipeline
description: Monitor and operate the AI news pipeline. Use this skill when asked about pipeline status, article counts, last run results, errors, or to trigger a manual run.
---

# News Pipeline Skill

You are operating the AI news pipeline on this server. Use the exec tool with workdir `/home/azureuser/ai-news-agent/openclaw` for all commands. Never use sudo.

## What You Can Do

### Check last pipeline run status
```
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('runs').select('*').order('ran_at', { ascending: false }).limit(1).then(({ data }) => console.log(JSON.stringify(data[0], null, 2)));
"
```
Report: status, articles_collected, articles_summarized, duration_ms, ran_at, and any error_msg.

### Check article counts
```
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
Promise.all([
  sb.from('articles').select('id', { count: 'exact', head: true }),
  sb.from('articles').select('id', { count: 'exact', head: true }).is('summary', null),
  sb.from('articles').select('id', { count: 'exact', head: true }).is('tags', null).not('summary', 'is', null)
]).then(([total, unsummarized, untagged]) => {
  console.log('Total articles:', total.count);
  console.log('Pending summary:', unsummarized.count);
  console.log('Pending tags:', untagged.count);
});
"
```

### Check today's collected articles
```
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const today = new Date(); today.setHours(0,0,0,0);
sb.from('articles').select('title, source, published_at').gte('created_at', today.toISOString()).order('created_at', { ascending: false }).then(({ data }) => {
  console.log('Articles collected today:', data.length);
  data.forEach(a => console.log('-', a.source, '|', a.title.substring(0, 60)));
});
"
```

### Run the full pipeline manually
```
node scripts/run.js
```
Wait for output. Report articles_collected, articles_summarized, and any errors.

### Run the tagger manually
```
node scripts/tagger.js
```
Report how many articles were tagged.

### Run only the collector
```
node scripts/collector.js
```

### Run only the summarizer
```
node scripts/summarizer.js
```

### Check pipeline run history (last 5 runs)
```
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('runs').select('ran_at, articles_collected, articles_summarized, status, duration_ms, error_msg').order('ran_at', { ascending: false }).limit(5).then(({ data }) => console.log(JSON.stringify(data, null, 2)));
"
```

## How to Answer Common Questions

**"Is the pipeline healthy?"**
Run the last run status check. If status is 'success' and ran_at is within the last 5 hours, report healthy. If status is 'error' or ran_at is older than 5 hours, report the issue.

**"How many articles were collected today?"**
Run the today's articles check. Report total count and list titles by source.

**"What happened last run?"**
Run the last run status check. Report all fields in plain English.

**"Run the pipeline now"**
Execute `node scripts/run.js` and report results.

**"Show pipeline stats"**
Run the article counts check. Report total, pending summary, pending tags.

## Response Format

Always reply in plain English. Include numbers, timestamps (converted to readable format), and a one-line health assessment at the end.
