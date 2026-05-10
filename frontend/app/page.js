import { createClient } from '@supabase/supabase-js';
import PageContent from './components/PageContent';

async function getData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const [articlesRes, runsRes] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, url, source, published_at, summary, created_at')
      .gte('published_at', fiveDaysAgo)
      .order('published_at', { ascending: false })
      .limit(100),
    supabase
      .from('runs')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (articlesRes.error) throw new Error(articlesRes.error.message);

  return {
    articles: articlesRes.data,
    runCount: runsRes.count || 0,
  };
}

export default async function Home() {
  const { articles, runCount } = await getData();
  return <PageContent articles={articles} runCount={runCount} />;
}
