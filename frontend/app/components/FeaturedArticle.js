'use client';

import { stripMarkdown, generateTags, relativeTime, isNew } from '../lib/utils';

const SOURCE_LABELS = {
  'hackernews':    'Hacker News',
  'techcrunch-ai': 'TechCrunch',
  'google-news':   'Google News',
};

function NeuralNetSVG() {
  const inputNodes  = [[45, 75], [45, 140], [45, 205]];
  const hiddenNodes = [[110, 55], [110, 105], [110, 160], [110, 215]];
  const outputNodes = [[175, 100], [175, 185]];

  const inputToHidden = inputNodes.flatMap(([x1, y1]) =>
    hiddenNodes.map(([x2, y2]) => ({ x1, y1, x2, y2 }))
  );
  const hiddenToOutput = hiddenNodes.flatMap(([x1, y1]) =>
    outputNodes.map(([x2, y2]) => ({ x1, y1, x2, y2 }))
  );

  const lineOpacity = (y1, y2) => {
    const dist = Math.abs(y1 - y2);
    if (dist < 30) return 0.55;
    if (dist < 80) return 0.35;
    return 0.18;
  };

  return (
    <svg
      width="230" height="280" viewBox="0 0 230 280" fill="none"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0 }}
    >
      <defs>
        <filter id="feat-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="feat-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Input → Hidden lines */}
      {inputToHidden.map(({ x1, y1, x2, y2 }, i) => (
        <line key={`ih-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#4F8CFF" strokeWidth="0.75" opacity={lineOpacity(y1, y2)} />
      ))}

      {/* Hidden → Output lines */}
      {hiddenToOutput.map(({ x1, y1, x2, y2 }, i) => (
        <line key={`ho-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#22D3EE" strokeWidth="0.75" opacity={lineOpacity(y1, y2)} />
      ))}

      {/* Input nodes */}
      {inputNodes.map(([cx, cy], i) => (
        <circle key={`in-${i}`} cx={cx} cy={cy} r="4.5" fill="#4F8CFF" opacity="0.7" filter="url(#feat-glow)" />
      ))}

      {/* Hidden nodes */}
      {hiddenNodes.map(([cx, cy], i) => (
        <circle key={`hn-${i}`} cx={cx} cy={cy} r="6" fill="#4F8CFF" opacity="0.85" filter="url(#feat-glow)" />
      ))}

      {/* Output nodes */}
      {outputNodes.map(([cx, cy], i) => (
        <g key={`on-${i}`}>
          <circle cx={cx} cy={cy} r="9" fill="#22D3EE" opacity="0.15" />
          <circle cx={cx} cy={cy} r="6.5" fill="#22D3EE" opacity="0.9" filter="url(#feat-glow-lg)" />
        </g>
      ))}
    </svg>
  );
}

// Static hex cell data — pre-computed so server and client produce identical strings,
// avoiding floating-point trig differences that cause React hydration mismatches.
const HEX_CELLS = [
  { pts: "45,22 36.5,34.56 19.5,34.56 11,22 19.5,9.44 36.5,9.44",        opacity: 0.35, fillOp: 0.053 },
  { pts: "79,22 70.5,34.56 53.5,34.56 45,22 53.5,9.44 70.5,9.44",        opacity: 0.25, fillOp: 0.038 },
  { pts: "113,22 104.5,34.56 87.5,34.56 79,22 87.5,9.44 104.5,9.44",     opacity: 0.15, fillOp: 0.023 },
  { pts: "62,48 53.5,60.56 36.5,60.56 28,48 36.5,35.44 53.5,35.44",      opacity: 0.20, fillOp: 0.030 },
  { pts: "96,48 87.5,60.56 70.5,60.56 62,48 70.5,35.44 87.5,35.44",      opacity: 0.45, fillOp: 0.068 },
  { pts: "130,48 121.5,60.56 104.5,60.56 96,48 104.5,35.44 121.5,35.44", opacity: 0.20, fillOp: 0.030 },
  { pts: "45,74 36.5,86.56 19.5,86.56 11,74 19.5,61.44 36.5,61.44",      opacity: 0.15, fillOp: 0.023 },
  { pts: "79,74 70.5,86.56 53.5,86.56 45,74 53.5,61.44 70.5,61.44",      opacity: 0.25, fillOp: 0.038 },
  { pts: "113,74 104.5,86.56 87.5,86.56 79,74 87.5,61.44 104.5,61.44",   opacity: 0.15, fillOp: 0.023 },
];

function HexGridSVG() {
  return (
    <svg
      width="130" height="95" viewBox="0 0 130 95" fill="none"
      style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'none', opacity: 0.13 }}
    >
      {HEX_CELLS.map(({ pts, opacity, fillOp }, i) => (
        <polygon key={i} points={pts} stroke="#4F8CFF" strokeWidth="1" fill="#4F8CFF" fillOpacity={fillOp} opacity={opacity} />
      ))}
    </svg>
  );
}

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
        <div style={{
          position: 'relative',
          padding: '36px 40px',
          borderRight: `1px solid ${t.featuredBorder}`,
          overflow: 'hidden',
        }}>

          {/* Hex grid watermark */}
          <HexGridSVG />

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

          {/* Neural network illustration */}
          <NeuralNetSVG />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: t.textMuted, marginBottom: 8 }}>SOURCE</div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.08)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              {SOURCE_LABELS[article.source] || article.source}
            </div>
          </div>

          <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
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
