require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { Agent } = require('../lib/agent');

const VALID_TAGS = ['llm', 'agents', 'open-source', 'research', 'tools', 'industry', 'hardware', 'security', 'data'];

async function tagArticle(title, summary) {
  const prompt = `You are a news categorization system. Given this AI/ML article, return 1-3 relevant tags as a comma-separated list.

Only use tags from this list: ${VALID_TAGS.join(', ')}

Article title: ${title}
Summary: ${summary || ''}

Respond with only the tags, comma-separated. Example: llm, agents`;

  const res = await fetch('https://ollama.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'ministral-3:3b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 30,
    }),
  });

  if (!res.ok) throw new Error(`Ollama API returned ${res.status}`);

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from Ollama');

  const tags = raw
    .toLowerCase()
    .split(',')
    .map(t => t.trim())
    .filter(t => VALID_TAGS.includes(t));

  if (tags.length === 0) throw new Error(`No valid tags in response: "${raw}"`);
  return tags;
}

const taggerAgent = new Agent('tagger', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  );

  const { data: pending, error } = await supabase
    .from('articles')
    .select('id, title, summary')
    .not('summary', 'is', null)
    .is('tags', null)
    .limit(20);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  if (!pending || pending.length === 0) {
    console.log('  no articles need tagging');
    return { tagged: 0 };
  }

  console.log(`  ${pending.length} articles to tag`);
  let tagged = 0;

  for (const article of pending) {
    try {
      const tags = await tagArticle(article.title, article.summary);
      const { error: updateError } = await supabase
        .from('articles')
        .update({ tags })
        .eq('id', article.id);

      if (updateError) throw new Error(updateError.message);
      console.log(`  ✓ [${tags.join(', ')}] ${article.title.slice(0, 50)}`);
      tagged++;
    } catch (err) {
      console.error(`  ✗ skipped "${article.title.slice(0, 50)}": ${err.message}`);
    }
  }

  return { tagged };
});

if (require.main === module) {
  taggerAgent.run()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('tagger fatal:', err.message);
      process.exit(1);
    });
}

module.exports = taggerAgent;
