export default function GapList({ matchResult }) {
  if (!matchResult) return null;

  const missing = matchResult.missing_skills || [];
  const matched = matchResult.matched_skills || [];
  const pct = matchResult.match_percentage ?? 0;
  const source = matchResult.source === 'jd_overlay' ? 'JD Match' : 'Taxonomy';
  const sourceColor = matchResult.source === 'jd_overlay' ? '#f59e42' : '#8b5cf6';

  return (
    <div className="glass-card animate-fade-up" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🎯 Skill Gap Analysis</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {matched.length} matched · {missing.length} missing
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: sourceColor,
            background: sourceColor + '18', padding: '4px 12px',
            borderRadius: 99, border: `1px solid ${sourceColor}30`,
          }}>{source}</span>
          <span style={{
            fontSize: 28, fontWeight: 800, color: pct >= 70 ? '#10d98f' : pct >= 50 ? '#f59e42' : '#f87171',
            fontFamily: 'Outfit, sans-serif',
          }}>{pct}%</span>
        </div>
      </div>

      {/* Missing skills */}
      {missing.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', marginBottom: 10 }}>
            ❌ Missing from your resume ({missing.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {missing.map((m, i) => (
              <div key={i} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#f87171', fontWeight: 500,
              }}>
                {m.skill || m.taxonomy_skill}
                {m.type === 'required' && (
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>required</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched skills */}
      {matched.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#10d98f', marginBottom: 10 }}>
            ✅ Matched skills ({matched.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {matched.slice(0, 12).map((m, i) => (
              <div key={i} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13,
                background: 'rgba(16,217,143,0.07)', border: '1px solid rgba(16,217,143,0.2)',
                color: '#10d98f', fontWeight: 500,
              }}>
                {m.taxonomy_skill || m.jd_skill}
              </div>
            ))}
            {matched.length > 12 && (
              <div style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, color: 'var(--text-muted)' }}>
                +{matched.length - 12} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
