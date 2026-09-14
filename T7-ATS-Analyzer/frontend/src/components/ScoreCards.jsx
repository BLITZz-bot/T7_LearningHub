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
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{cfg.icon} {cfg.label}</p>
              <span style={{
                fontSize: 11, fontWeight: 600, color: bandColor,
                background: bandColor + '18', padding: '2px 10px',
                borderRadius: 99, letterSpacing: 0.5,
              }}>{band}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{cfg.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
