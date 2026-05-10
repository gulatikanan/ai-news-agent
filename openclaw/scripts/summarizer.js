require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { Agent } = require('../lib/agent');

async function summarizeArticle(title) {
  const prompt = `Summarize this AI/ML news in 2-3 sentences. Developer-focused tone, factual, no hype:\n\n${title}`;

  const res = await fetch('https://ollama.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'ministral-3:3b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    }),
  });

  if (!res.ok) throw new Error(`Ollama API returned ${res.status}`);

  const json = await res.json();
  const summary = json.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error('Empty response from Ollama');
  return summary;
}

const summarizerAgent = new Agent('summarizer', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  );

  const { data: pending, error } = await supabase
    .from('articles')
    .select('id, title')
    .is('summary', null)
    .limit(20);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  if (!pending || pending.length === 0) {
    console.log('  no articles need summarizing');
    return { summarized: 0 };
  }

  console.log(`  ${pending.length} articles to summarize`);
  let summarized = 0;

  for (const article of pending) {
    try {
      const summary = await summarizeArticle(article.title);
      const { error: updateError } = await supabase
        .from('articles')
        .update({ summary })
        .eq('id', article.id);

      if (updateError) throw new Error(updateError.message);
      console.log(`  ✓ ${article.title.slice(0, 60)}`);
      summarized++;
    } catch (err) {
      console.error(`  ✗ skipped "${article.title.slice(0, 60)}": ${err.message}`);
    }
  }

  return { summarized };
});

module.exports = summarizerAgent;
