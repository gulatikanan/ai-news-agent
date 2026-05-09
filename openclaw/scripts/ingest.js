require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');

const FEEDS = [
  {
    url: 'https://news.ycombinator.com/rss',
    source: 'hackernews',
    filter: true,
  },
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source: 'techcrunch-ai',
  },
  {
    url: 'https://news.google.com/rss/search?q=AI+engineering+LLM+developer+tools&hl=en-US&gl=US&ceid=US:en',
    source: 'google-news',
  },
];

const HN_KEYWORDS = [
  'ai', 'llm', 'ml', 'gpt', 'claude', 'gemini', 'agent', 'openai',
  'anthropic', 'mistral', 'ollama', 'model', 'inference', 'vector',
  'embedding', 'fine-tun', 'transformer', 'diffusion', 'copilot',
  'cursor', 'rag', 'langchain', 'mcp', 'agentic', 'developer tool',
  'open-source ai', 'neural', 'deep learning', 'hugging face', 'cohere',
];

function isAIRelated(title) {
  const lower = title.toLowerCase();
  return HN_KEYWORDS.some(kw => lower.includes(kw));
}

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

async function ingest() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const parser = new Parser();
  const articles = [];

  for (const feed of FEEDS) {
    try {
      console.log(`Fetching ${feed.source}...`);
      const parsed = await parser.parseURL(feed.url);

      const items = parsed.items
        .map(item => ({
          title: item.title?.trim() || null,
          url: item.link || item.guid || null,
          source: feed.source,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        }))
        .filter(a => a.title && a.url)
        .filter(a => !feed.filter || isAIRelated(a.title))
        .filter(a => {
          if (!a.published_at) return true;
          return Date.now() - new Date(a.published_at).getTime() < 7 * 24 * 60 * 60 * 1000;
        });

      console.log(`  → ${items.length} articles parsed`);
      articles.push(...items);
    } catch (err) {
      console.error(`  Failed to fetch ${feed.source}: ${err.message}`);
    }
  }

  if (articles.length === 0) {
    console.log('No articles to insert.');
    return;
  }

  console.log(`\nUpserting ${articles.length} articles into Supabase...`);

  const { data, error } = await supabase
    .from('articles')
    .upsert(articles, { onConflict: 'url', ignoreDuplicates: true })
    .select('id, title');

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  console.log(`${data.length} new articles inserted.`);

  if (data.length === 0) return;

  console.log(`\nSummarizing ${data.length} new articles...`);

  for (const article of data) {
    try {
      const summary = await summarizeArticle(article.title);

      const { error: updateError } = await supabase
        .from('articles')
        .update({ summary })
        .eq('id', article.id);

      if (updateError) throw new Error(updateError.message);

      console.log(`  ✓ ${article.title.slice(0, 60)}...`);
    } catch (err) {
      console.error(`  ✗ Skipped "${article.title.slice(0, 60)}...": ${err.message}`);
    }
  }

  console.log('Done.');
}

ingest().catch(err => {
  console.error(err.message);
  process.exit(1);
});
