import { createClient } from '@supabase/supabase-js';

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#+\s/g, '')
    .trim();
}

async function getArticles() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, url, source, published_at, summary')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data;
}

export default async function Home() {
  const articles = await getArticles();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">AI Engineering News</h1>
      <p className="text-gray-500 text-sm mb-8">Latest from the AI/ML developer ecosystem</p>

      <div className="space-y-8">
        {articles.map(article => (
          <div key={article.id} className="border-b border-gray-200 pb-8">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold hover:underline"
            >
              {article.title}
            </a>
            <div className="text-xs text-gray-400 mt-1 mb-3">
              {article.source} &middot; {article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}
            </div>
            {article.summary && (
              <p className="text-sm text-gray-600 leading-relaxed">{stripMarkdown(article.summary)}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
