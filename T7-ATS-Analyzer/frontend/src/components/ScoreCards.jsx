import { useEffect, useRef } from 'react';

const SCORE_CONFIGS = [
  { key: 'ats_parseability',      label: 'ATS Parseability',      color: '#5b8dee', icon: '🤖', desc: 'Can ATS robots read your resume?' },
  { key: 'impact_quantification', label: 'Impact & Quantification', color: '#10d98f', icon: '📈', desc: 'Are your bullets achievement-focused?' },
  { key: 'skill_match',           label: 'Skill Match',            color: '#8b5cf6', icon: '🎯', desc: 'Match vs market taxonomy for your role' },
  { key: 'formatting',            label: 'Formatting Quality',     color: '#f59e42', icon: '✨', desc: 'Clean layout for human recruiters' },
];

function ScoreRing({ score, color, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const lineW = 9;

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Score arc
    const pct = (score || 0) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.stroke();
  }, [score, color, size]);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
          {score ?? '—'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span>
      </div>
    </div>
  );
}

export default function ScoreCards({ scores }) {
  if (!scores) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: 16,
      marginBottom: 32,
    }}>
      {SCORE_CONFIGS.map((cfg, i) => {
        const val = scores[cfg.key];
        const pct = val ?? 0;
        const band = pct >= 80 ? 'Strong' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs work';
        const bandColor = pct >= 80 ? '#10d98f' : pct >= 60 ? '#5b8dee' : pct >= 40 ? '#f59e42' : '#f87171';

        return (
          <div
            key={cfg.key}
            className="glass-card animate-fade-up"
            style={{
              padding: '24px 20px',
              animationDelay: `${i * 80}ms`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = cfg.color + '60'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
          >
            <ScoreRing score={val} color={cfg.color} size={110} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>{cfg.icon} {cfg.label}</p>
              <span style={{
                fontSize: 11, fontWeight: 600, color: bandColor,
                background: bandColor + '18', padding: '3px 12px',
                borderRadius: 99, letterSpacing: 0.5,
              }}>{band}</span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{cfg.desc}</p>
          </div>
        );
      })}

      {/* 5th View Jobs Card */}
      <div
        className="glass-card animate-fade-up"
        style={{
          padding: '24px 20px',
          animationDelay: `${SCORE_CONFIGS.length * 80}ms`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          textAlign: 'center',
          transition: 'transform 0.2s, border-color 0.2s',
          cursor: 'pointer',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(91,141,238,0.05) 100%)'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#5b8dee60'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
        onClick={() => {
          const feed = document.getElementById('ats-job-feed');
          if (feed) feed.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(91,141,238,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 8,
          border: '1px solid rgba(91,141,238,0.3)'
        }}>
          💼
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>View Jobs</p>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#5b8dee',
            background: '#5b8dee18', padding: '3px 12px',
            borderRadius: 99, letterSpacing: 0.5,
          }}>Market Insights</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>See live job postings matching your skills.</p>
      </div>
    </div>
  );
}
