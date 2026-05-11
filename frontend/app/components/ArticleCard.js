'use client';

import { forwardRef, useState } from 'react';
import { stripMarkdown, isNew, generateTags, extractWhyMatters, relativeTime } from '../lib/utils';

const SOURCE_LABELS = {
  'hackernews':    'Hacker News',
  'techcrunch-ai': 'TechCrunch',
  'google-news':   'Google News',
};

const SOURCE_COLORS = {
  dark: {
    'hackernews':    { bg: 'rgba(249,115,22,0.12)', text: '#FB923C', border: 'rgba(249,115,22,0.25)' },
    'techcrunch-ai': { bg: 'rgba(16,185,129,0.12)', text: '#34D399', border: 'rgba(16,185,129,0.25)' },
    'google-news':   { bg: 'rgba(79,140,255,0.12)', text: '#60A5FA', border: 'rgba(79,140,255,0.25)' },
  },
  light: {
    'hackernews':    { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    'techcrunch-ai': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    'google-news':   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  },
};

const ArticleCard = forwardRef(function ArticleCard({ t, article, index, isFocused, mode }, ref) {
  const [hovered, setHovered] = useState(false);

  const summary = stripMarkdown(article.summary || '');
  const tags = generateTags(article.title, summary);
  const whyMatters = extractWhyMatters(summary);
  const sc = (SOURCE_COLORS[mode] || SOURCE_COLORS.dark)[article.source] || { bg: 'rgba(255,255,255,0.06)', text: '#9CA3AF', border: 'rgba(255,255,255,0.1)' };

  // Subtle layout variance — every 5th card gets a slight accent tint
  const isAccented = index % 5 === 0;
  const cardBorder = isFocused
    ? t.accent
    : hovered
      ? t.cardBorderHover
      : isAccented
        ? 'rgba(79,140,255,0.18)'
        : t.cardBorder;

  const cardShadow = hovered
    ? t.cardGlowHover
    : isAccented
      ? '0 2px 12px rgba(79,140,255,0.06)'
      : t.cardShadow;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: cardShadow,
        cursor: 'default',
      }}
    >
      {/* Top row — source badge + NEW badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
          letterSpacing: '0.02em',
        }}>
          {SOURCE_LABELS[article.source] || article.source}
        </span>
        {isNew(article.published_at) && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
            background: 'rgba(16,185,129,0.12)', color: '#10B981',
            border: '1px solid rgba(16,185,129,0.25)', letterSpacing: '0.06em',
          }}>NEW</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: t.textMuted }}>
          {article.published_at
            ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : ''}
        </span>
      </div>

      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: t.textPrimary,
          lineHeight: 1.45,
          letterSpacing: '-0.01em',
          textDecoration: 'none',
          transition: 'opacity 0.15s',
          opacity: hovered ? 0.75 : 1,
        }}
      >
        {article.title}
      </a>

      {/* Summary — clamped to 4 lines */}
      {summary && (
        <p style={{
          fontSize: 12,
          color: t.textSecondary,
          lineHeight: 1.65,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {summary}
        </p>
      )}

      {/* Why this matters */}
      {whyMatters && (
        <div style={{
          fontSize: 11,
          color: t.accent,
          lineHeight: 1.5,
          padding: '8px 10px',
          borderRadius: 6,
          background: 'rgba(79,140,255,0.06)',
          borderLeft: `2px solid rgba(79,140,255,0.35)`,
        }}>
          <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>Why this matters → </span>
          {whyMatters}.
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 4,
              background: t.tagBg,
              color: t.textMuted,
              border: `1px solid ${t.tagBorder}`,
              letterSpacing: '0.02em',
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* View Article button */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 4,
          padding: '7px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: t.accent,
          border: `1px solid ${t.accent}`,
          background: 'transparent',
          textDecoration: 'none',
          textAlign: 'center',
          transition: 'background 0.15s, color 0.15s',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = t.accent;
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = t.accent;
        }}
      >
        View Article →
      </a>
    </div>
  );
});

export default ArticleCard;
