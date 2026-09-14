import { useState } from 'react';

function RewriteCard({ item, index }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(item.rewritten || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="animate-fade-up"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 20,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Issue badge */}
      <span style={{
        fontSize: 11, fontWeight: 600, color: '#f59e42',
        background: 'rgba(245,158,66,0.12)', padding: '3px 10px',
        borderRadius: 99, marginBottom: 12, display: 'inline-block',
        border: '1px solid rgba(245,158,66,0.2)',
      }}>
        ⚠ {item.issue || 'Weak bullet'}
      </span>

      {/* Before */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Before</p>
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)',
          background: 'rgba(248,113,113,0.05)', padding: '10px 14px',
          borderRadius: 8, borderLeft: '3px solid rgba(248,113,113,0.4)',
          lineHeight: 1.5,
        }}>
          {item.original}
        </p>
      </div>

      {/* After */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>After</p>
        <p style={{
          fontSize: 14, color: 'var(--text-primary)',
          background: 'rgba(16,217,143,0.05)', padding: '10px 14px',
          borderRadius: 8, borderLeft: '3px solid rgba(16,217,143,0.4)',
          lineHeight: 1.5,
        }}>
          {item.rewritten}
        </p>
      </div>

      {/* Reasoning + Copy */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '80%' }}>
          {item.reasoning}
        </p>
        <button
          onClick={copy}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: copied ? 'rgba(16,217,143,0.15)' : 'rgba(91,141,238,0.12)',
            border: `1px solid ${copied ? 'rgba(16,217,143,0.3)' : 'rgba(91,141,238,0.3)'}`,
            color: copied ? '#10d98f' : 'var(--accent-blue)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function RewriteSuggestions({ rewrites, onRequestRewrites, isLoading, hasWeakBullets }) {
  if (!hasWeakBullets && !rewrites?.length) return null;

  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>✍️ Bullet Rewrites</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Hallucination-guarded — uses <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4 }}>[ADD: metric]</code> placeholders instead of fabricating numbers
          </p>
        </div>
        {!rewrites?.length && (
          <button
            onClick={onRequestRewrites}
            disabled={isLoading}
            style={{
              padding: '10px 22px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
              background: isLoading ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg, #8b5cf6, #5b8dee)',
              border: 'none', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s', opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '✨ Rewriting…' : '✨ Generate Rewrites'}
          </button>
        )}
      </div>

      {rewrites?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rewrites.map((item, i) => (
            <RewriteCard key={i} item={item} index={i} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          Click "Generate Rewrites" to get AI-powered bullet improvements for the flagged weak bullets
        </div>
      )}
    </div>
  );
}
