import { createClient } from '@supabase/supabase-js';
import PageContent from './components/PageContent';

async function getArticles() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, url, source, published_at, summary, created_at')
    .gte('published_at', fiveDaysAgo)
    .order('published_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data;
}

export default async function Home() {
  const articles = await getArticles();
  return <PageContent articles={articles} />;
}
