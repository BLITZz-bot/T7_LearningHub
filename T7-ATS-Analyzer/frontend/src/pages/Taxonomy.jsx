import { useState, useEffect } from 'react';

export default function Taxonomy() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState(null);

  useEffect(() => {
    fetch('/api/taxonomy/')
      .then(r => r.json())
      .then(d => setRoles(d.roles || []))
      .catch(() => {});
  }, []);

  const loadSkills = async (role) => {
    setSelectedRole(role);
    setIsLoading(true);
    try {
      const r = await fetch(`/api/taxonomy/${encodeURIComponent(role)}`);
      const d = await r.json();
      setSkills(d.skills || []);
    } catch { setSkills([]); }
    setIsLoading(false);
  };

  const triggerBootstrap = async () => {
    const r = await fetch('/api/admin/taxonomy/bootstrap', { method: 'POST' });
    const d = await r.json();
    setBootstrapStatus(d.message);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>
        🌐 <span className="grad-text">Skill Taxonomy</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Live canonical skills mined from {'>'}35 roles across Adzuna, JSearch & Jooble
      </p>

      {/* Admin: bootstrap */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🚀 Bootstrap Taxonomy</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fetches all jobs from all APIs, extracts skills, promotes canonical — runs once in background</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {bootstrapStatus && (
            <span style={{ fontSize: 12, color: '#10d98f', background: 'rgba(16,217,143,0.1)', padding: '4px 12px', borderRadius: 99 }}>
              {bootstrapStatus}
            </span>
          )}
          <button onClick={triggerBootstrap} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #5b8dee, #8b5cf6)',
            border: 'none', color: 'white', cursor: 'pointer',
          }}>
            Run Bootstrap
          </button>
        </div>
      </div>

      {/* Role list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: 20 }}>
        <div className="glass-card" style={{ padding: 16, height: 'fit-content', maxHeight: 600, overflowY: 'auto' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {roles.length} roles with canonical skills
          </p>
          {roles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No canonical skills yet — run bootstrap first</p>
          ) : (
            roles.map(r => (
              <div
                key={r}
                onClick={() => loadSkills(r)}
                style={{
                  padding: '9px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13,
                  cursor: 'pointer', marginBottom: 4,
                  background: selectedRole === r ? 'rgba(91,141,238,0.12)' : 'transparent',
                  color: selectedRole === r ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: selectedRole === r ? '1px solid rgba(91,141,238,0.25)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </div>
            ))
          )}
        </div>

        {/* Skills panel */}
        <div>
          {selectedRole ? (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedRole}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{skills.length} canonical skills</p>
              {isLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {skills.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{s.skill_name}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>📊 {s.frequency_30d}× / 30d</span>
                        <span>🏢 {s.company_count} companies</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Select a role to inspect its canonical skills</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
