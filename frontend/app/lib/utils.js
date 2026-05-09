export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#+\s/g, '')
    .trim();
}

export function isNew(publishedAt) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 24 * 60 * 60 * 1000;
}

export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const TAG_MAP = {
  'llm':          ['llm', 'language model', 'gpt', 'claude', 'gemini', 'mistral', 'transformer', 'foundation model'],
  'agents':       ['agent', 'agentic', 'autonomous', 'copilot', 'multi-agent'],
  'inference':    ['inference', 'cuda', 'gpu', 'latency', 'throughput', 'serving', 'vllm', 'triton'],
  'open-source':  ['open-source', 'open source', 'github', 'hugging face', 'ollama', 'apache'],
  'tooling':      ['cursor', 'developer tool', 'sdk', 'cli', 'framework', 'library', 'mcp'],
  'rag':          ['rag', 'retrieval', 'vector', 'embedding', 'semantic search'],
  'research':     ['paper', 'research', 'benchmark', 'study', 'arxiv', 'dataset', 'evals'],
  'startup':      ['raises', 'funding', 'valuation', 'series', 'launch', 'billion', 'acqui'],
};

export function generateTags(title, summary = '') {
  const text = `${title} ${summary}`.toLowerCase();
  const tags = [];
  for (const [tag, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some(kw => text.includes(kw))) tags.push(tag);
  }
  return tags.slice(0, 3);
}

export function extractWhyMatters(summary) {
  if (!summary) return null;
  const clean = stripMarkdown(summary);
  const sentences = clean.split(/\.(?:\s|$)/).map(s => s.trim()).filter(s => s.length > 25);
  if (sentences.length < 2) return null;
  const last = sentences[sentences.length - 1];
  return last.length > 25 && last.length < 180 ? last : null;
}
