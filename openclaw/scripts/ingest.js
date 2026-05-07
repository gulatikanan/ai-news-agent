require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');

const FEEDS = [
  {
    url: 'https://news.ycombinator.com/rss',
    source: 'hackernews',
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
        .filter(a => a.title && a.url);

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

  console.log(`Done. ${data.length} new articles inserted.`);
}

ingest().catch(err => {
  console.error(err.message);
  process.exit(1);
});
