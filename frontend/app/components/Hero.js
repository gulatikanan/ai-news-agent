'use client';

import { relativeTime } from '../lib/utils';

export default function Hero({ t, articleCount, lastUpdatedAt }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 56px' }}>

      {/* Ambient orbs */}
      <div className="orb" style={{
        position: 'absolute', top: '5%', right: '12%',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,140,255,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="orb-reverse" style={{
        position: 'absolute', bottom: '0%', left: '5%',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.3' stroke-opacity='0.06'%3E%3Cpath d='M40 0L0 0 0 40'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-5xl mx-auto px-4" style={{ position: 'relative' }}>

        {/* Live system indicator */}
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: t.accentEmerald, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: t.accentEmerald, letterSpacing: '0.08em', fontWeight: 500 }}>
            LIVE AI SUMMARIES
          </span>
        </div>

        {/* Main headline */}
        <h1 className="fade-in-up" style={{
          fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 700,
          color: t.textPrimary,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          marginBottom: 20,
          maxWidth: 700,
        }}>
          AI Engineering
          <br />
          <span style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentCyan} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Intelligence
          </span>
        </h1>

        {/* Tagline */}
        <p className="fade-in-up" style={{
          fontSize: 16,
          color: t.textSecondary,
          lineHeight: 1.6,
          maxWidth: 480,
          marginBottom: 36,
          animationDelay: '0.05s',
        }}>
          Signal-first news for developers building the future of AI.
        </p>

        {/* Live stats row */}
        <div className="fade-in-up" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, letterSpacing: '-0.02em' }}>
              {articleCount}
            </span>
            <span style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.05em' }}>AI SIGNALS PROCESSED</span>
          </div>
          <div style={{ width: 1, background: t.divider, alignSelf: 'stretch' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, letterSpacing: '-0.02em' }}>
              {lastUpdatedAt ? relativeTime(lastUpdatedAt) : '—'}
            </span>
            <span style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.05em' }}>LAST UPDATED</span>
          </div>
          <div style={{ width: 1, background: t.divider, alignSelf: 'stretch' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, letterSpacing: '-0.02em' }}>3</span>
            <span style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.05em' }}>LIVE SOURCES</span>
          </div>
        </div>
      </div>
    </section>
  );
}
