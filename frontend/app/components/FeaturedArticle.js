'use client';

import { stripMarkdown, generateTags, relativeTime, isNew } from '../lib/utils';

const SOURCE_LABELS = {
  'hackernews':    'Hacker News',
  'techcrunch-ai': 'TechCrunch',
  'google-news':   'Google News',
};

export default function FeaturedArticle({ t, article }) {
  if (!article) return null;

  const summary = stripMarkdown(article.summary || '');
  const tags = generateTags(article.title, summary);

  return (
    <div style={{ position: 'relative', marginBottom: 40 }}>

      {/* Spotlight glow behind card */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%', height: '120%',
        background: `radial-gradient(ellipse, ${t.featuredGlow} 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: t.featuredBg,
        border: `1px solid ${t.featuredBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
      }}>

        {/* Left — main content */}
        <div style={{ padding: '36px 40px', borderRight: `1px solid ${t.featuredBorder}` }}>

          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: t.accent, textTransform: 'uppercase',
            }}>
              ◆ AI Signal of the Day
            </span>
            {isNew(article.published_at) && (
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(16,185,129,0.12)',
                color: t.accentEmerald,
                border: `1px solid rgba(16,185,129,0.25)`,
              }}>NEW</span>
            )}
          </div>

          {/* Title */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              fontSize: 'clamp(18px, 2.2vw, 24px)',
              fontWeight: 700,
              color: t.textPrimary,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              textDecoration: 'none',
              marginBottom: 16,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {article.title}
          </a>

          {/* Summary — full, not clamped */}
          {summary && (
            <p style={{
              fontSize: 14,
              color: t.textSecondary,
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              {summary}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(79,140,255,0.1)',
                  color: t.accent,
                  border: `1px solid rgba(79,140,255,0.2)`,
                  letterSpacing: '0.02em',
                }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.06)',
              color: t.textSecondary,
              border: `1px solid rgba(255,255,255,0.08)`,
            }}>
              {SOURCE_LABELS[article.source] || article.source}
            </span>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : ''}
            </span>
          </div>
        </div>

        {/* Right — accent panel */}
        <div style={{
          position: 'relative', padding: 32,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(79,140,255,0.04)',
          overflow: 'hidden',
        }}>

          {/* Decorative orb */}
          <div className="orb" style={{
            position: 'absolute', top: '10%', right: '-20%',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(79,140,255,0.18) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: t.textMuted, marginBottom: 8 }}>SOURCE</div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.08)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              {SOURCE_LABELS[article.source] || article.source}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: `rgba(79,140,255,0.12)`,
              border: `1px solid rgba(79,140,255,0.2)`,
            }}>
              <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: t.accent, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: t.accent, fontWeight: 500 }}>AI Summary</span>
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
              {article.published_at ? relativeTime(article.published_at) : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
