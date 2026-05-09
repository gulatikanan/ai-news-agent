'use client';

import { useState, useEffect, useRef } from 'react';
import Hero from './Hero';
import FeaturedArticle from './FeaturedArticle';
import ArticleCard from './ArticleCard';

const SOURCE_LABELS = {
  'hackernews':    'Hacker News',
  'techcrunch-ai': 'TechCrunch',
  'google-news':   'Google News',
};

const THEMES = {
  dark: {
    pageBg:           'linear-gradient(160deg, #050816 0%, #0B1020 55%, #080E1A 100%)',
    headerBg:         'rgba(5,8,22,0.82)',
    headerBorder:     'rgba(255,255,255,0.06)',
    cardBg:           '#111827',
    cardBorder:       'rgba(255,255,255,0.07)',
    cardBorderHover:  'rgba(79,140,255,0.5)',
    cardGlowHover:    '0 0 24px rgba(79,140,255,0.10), 0 4px 20px rgba(0,0,0,0.5)',
    cardShadow:       '0 2px 8px rgba(0,0,0,0.3)',
    featuredBg:       'linear-gradient(135deg, #161B2E 0%, #1A2040 100%)',
    featuredBorder:   'rgba(79,140,255,0.22)',
    featuredGlow:     'rgba(79,140,255,0.10)',
    textPrimary:      '#F9FAFB',
    textSecondary:    '#9CA3AF',
    textMuted:        '#6B7280',
    accent:           '#4F8CFF',
    accentCyan:       '#22D3EE',
    accentPurple:     '#8B5CF6',
    accentEmerald:    '#10B981',
    filterActive:     { background: '#ffffff', color: '#000000' },
    filterInactive:   { background: 'rgba(255,255,255,0.06)', color: '#6B7280' },
    progressGradient: 'linear-gradient(90deg, #4F8CFF, #22D3EE)',
    tagBg:            'rgba(255,255,255,0.04)',
    tagBorder:        'rgba(255,255,255,0.08)',
    divider:          'rgba(255,255,255,0.06)',
    footerBorder:     'rgba(255,255,255,0.05)',
    footerText:       '#374151',
    footerLink:       '#4B5563',
    toggleBg:         'rgba(255,255,255,0.07)',
    toggleColor:      '#6B7280',
    githubColor:      '#4B5563',
    emptyText:        '#374151',
  },
  light: {
    pageBg:           '#F3F4F6',
    headerBg:         'rgba(243,244,246,0.88)',
    headerBorder:     'rgba(0,0,0,0.07)',
    cardBg:           '#FFFFFF',
    cardBorder:       '#E5E7EB',
    cardBorderHover:  '#93C5FD',
    cardGlowHover:    '0 0 20px rgba(59,130,246,0.08), 0 4px 16px rgba(0,0,0,0.08)',
    cardShadow:       '0 1px 4px rgba(0,0,0,0.06)',
    featuredBg:       'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)',
    featuredBorder:   '#BFDBFE',
    featuredGlow:     'rgba(59,130,246,0.08)',
    textPrimary:      '#111827',
    textSecondary:    '#4B5563',
    textMuted:        '#9CA3AF',
    accent:           '#2563EB',
    accentCyan:       '#0891B2',
    accentPurple:     '#7C3AED',
    accentEmerald:    '#059669',
    filterActive:     { background: '#111827', color: '#ffffff' },
    filterInactive:   { background: '#E5E7EB', color: '#6B7280' },
    progressGradient: 'linear-gradient(90deg, #2563EB, #0891B2)',
    tagBg:            '#F3F4F6',
    tagBorder:        '#E5E7EB',
    divider:          '#E5E7EB',
    footerBorder:     '#E5E7EB',
    footerText:       '#9CA3AF',
    footerLink:       '#6B7280',
    toggleBg:         '#E5E7EB',
    toggleColor:      '#6B7280',
    githubColor:      '#9CA3AF',
    emptyText:        '#D1D5DB',
  },
};

export default function PageContent({ articles }) {
  const [mode, setMode]               = useState('dark');
  const [activeFilter, setActiveFilter] = useState('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible]         = useState(true);
  const articleRefs = useRef([]);
  const t = THEMES[mode];

  const filtered = activeFilter === 'all'
    ? articles
    : articles.filter(a => a.source === activeFilter);

  // Pick featured: prefer newest article with a summary from a curated source
  const featuredIndex = (() => {
    const preferred = filtered.findIndex(a => a.summary && (a.source === 'techcrunch-ai' || a.source === 'hackernews'));
    if (preferred !== -1) return preferred;
    const withSummary = filtered.findIndex(a => a.summary);
    return withSummary !== -1 ? withSummary : 0;
  })();

  const featured     = filtered[featuredIndex] || null;
  const restArticles = filtered.filter((_, i) => i !== featuredIndex);

  const lastUpdatedAt = articles.length > 0 ? articles[0]?.published_at : null;

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard J/K/O navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'j' || e.key === 'J') {
        setFocusedIndex(prev => Math.min(prev + 1, restArticles.length - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if ((e.key === 'o' || e.key === 'Enter') && focusedIndex >= 0) {
        window.open(restArticles[focusedIndex]?.url, '_blank');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [restArticles, focusedIndex]);

  useEffect(() => {
    if (focusedIndex >= 0 && articleRefs.current[focusedIndex]) {
      articleRefs.current[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleFilterChange = (source) => {
    if (source === activeFilter) return;
    setVisible(false);
    setFocusedIndex(-1);
    setTimeout(() => { setActiveFilter(source); setVisible(true); }, 150);
  };

  return (
    <div style={{ background: t.pageBg, minHeight: '100vh' }}>

      {/* Reading progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: 2,
        width: `${scrollProgress}%`,
        background: t.progressGradient,
        zIndex: 100, transition: 'width 0.1s linear',
      }} />

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: t.headerBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${t.headerBorder}`,
      }}>
        <div className="max-w-5xl mx-auto px-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>

          <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, letterSpacing: '-0.01em' }}>
            AI Engineering News
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', ...Object.keys(SOURCE_LABELS)].map(source => (
                <button key={source} onClick={() => handleFilterChange(source)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: 'none',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    ...(activeFilter === source ? t.filterActive : t.filterInactive),
                  }}>
                  {source === 'all' ? 'All' : SOURCE_LABELS[source]}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: t.divider }} />

            <a href="https://github.com/gulatikanan/ai-news-agent" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: t.githubColor, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              GitHub →
            </a>

            <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none',
                fontSize: 12, cursor: 'pointer', transition: 'opacity 0.15s',
                background: t.toggleBg, color: t.toggleColor,
              }}>
              {mode === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Hero t={t} articleCount={articles.length} lastUpdatedAt={lastUpdatedAt} />

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4" style={{ paddingBottom: 80 }}>

        {/* Keyboard shortcut hint */}
        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 28 }}>
          Press <kbd style={{ fontFamily: 'monospace', padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: `1px solid ${t.cardBorder}` }}>J</kbd>
          {' / '}
          <kbd style={{ fontFamily: 'monospace', padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: `1px solid ${t.cardBorder}` }}>K</kbd>
          {' to navigate · '}
          <kbd style={{ fontFamily: 'monospace', padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: `1px solid ${t.cardBorder}` }}>O</kbd>
          {' to open'}
        </p>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 14, color: t.emptyText }}>No signals found for this source yet.</p>
          </div>
        )}

        {/* Featured article */}
        <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}>
          {featured && <FeaturedArticle t={t} article={featured} />}

          {/* Section label */}
          {restArticles.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Latest Signals
              </span>
              <div style={{ flex: 1, height: 1, background: t.divider }} />
              <span style={{ fontSize: 11, color: t.textMuted }}>{restArticles.length} articles</span>
            </div>
          )}

          {/* Article grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}>
            {restArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                ref={el => articleRefs.current[i] = el}
                t={t}
                mode={mode}
                article={article}
                index={i}
                isFocused={focusedIndex === i}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${t.footerBorder}`, padding: '32px 0' }}>
        <div className="max-w-5xl mx-auto px-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: t.footerText }}>
            AI Engineering News — Autonomous intelligence feed
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Ollama', href: 'https://ollama.com' },
              { label: 'Supabase', href: 'https://supabase.com' },
              { label: 'OpenClaw', href: 'https://www.npmjs.com/package/openclaw' },
              { label: 'Next.js', href: 'https://nextjs.org' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: t.footerLink, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
