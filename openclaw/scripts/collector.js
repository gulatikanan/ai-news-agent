require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { Agent } = require('../lib/agent');

const FEEDS = [
  { url: 'https://news.ycombinator.com/rss', source: 'hackernews', filter: true },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'techcrunch-ai' },
  { url: 'https://news.google.com/rss/search?q=AI+engineering+LLM+developer+tools&hl=en-US&gl=US&ceid=US:en', source: 'google-news' },
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

const collectorAgent = new Agent('collector', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  );

  const parser = new Parser();
  const articles = [];

  for (const feed of FEEDS) {
    try {
      console.log(`  fetching ${feed.source}...`);
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

      console.log(`  → ${items.length} articles from ${feed.source}`);
      articles.push(...items);
    } catch (err) {
      console.error(`  failed to fetch ${feed.source}: ${err.message}`);
    }
  }

  if (articles.length === 0) {
    console.log('  no articles to insert');
    return { inserted: 0 };
  }

  const { data, error } = await supabase
    .from('articles')
    .upsert(articles, { onConflict: 'url', ignoreDuplicates: true })
    .select('id, title');

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);

  console.log(`  ${data.length} new articles inserted`);
  return { inserted: data.length };
});

module.exports = collectorAgent;
