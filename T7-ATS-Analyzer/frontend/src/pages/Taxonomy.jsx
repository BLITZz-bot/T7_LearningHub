import { useState, useEffect, useCallback } from 'react';

const TAXONOMY_MODELS = [
  ['gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite'],
  ['gemini-3.5-flash', 'Gemini 3.5 Flash'],
  ['gemini-3.6-flash', 'Gemini 3.6 Flash (Default)'],
  ['gemini-3.7-flash', 'Gemini 3.7 Flash'],
  ['gemini-3.8-flash', 'Gemini 3.8 Flash'],
];

export default function Taxonomy() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');

  const fetchRoles = useCallback(async () => {
    try {
      const r = await fetch('/api/taxonomy');
      const d = await r.json();
      if (Array.isArray(d.roles) && d.roles.length > 0) {
        setRoles(d.roles);
        return;
      }
      // Fallback
      const r2 = await fetch('/api/taxonomy/roles');
      const d2 = await r2.json();
      setRoles(d2.roles || []);
    } catch {
      // ignore
    }
  }, []);

  const checkBootstrapStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/taxonomy/bootstrap/status');
      if (!res.ok) return;
      const data = await res.json();
      if (data.running) {
        setIsBootstrapping(true);
        setBootstrapStatus(`⏳ Bootstrap in progress using ${data.model || 'Gemini'}…`);
      } else if (data.done) {
        setIsBootstrapping(false);
        if (data.error) {
          setBootstrapStatus(`⚠ Bootstrap error: ${data.error}`);
        } else if (data.result) {
          const count = data.result.skills_promoted || data.result.skills_extracted || 0;
          setBootstrapStatus(`✅ Bootstrap complete! (${count} skills processed)`);
          fetchRoles();
        }
      }
    } catch {
      // ignore
    }
  }, [fetchRoles]);

  // Check on mount (persists across tab switches)
  useEffect(() => {
    fetchRoles();
    checkBootstrapStatus();
  }, [fetchRoles, checkBootstrapStatus]);

  // Polling while active
  useEffect(() => {
    let interval;
    if (isBootstrapping) {
      interval = setInterval(() => {
        checkBootstrapStatus();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBootstrapping, checkBootstrapStatus]);

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
    if (isBootstrapping) return;
    setIsBootstrapping(true);
    setBootstrapStatus(`Starting bootstrap with ${selectedModel}…`);
    try {
      const r = await fetch(`/api/admin/taxonomy/bootstrap?model=${encodeURIComponent(selectedModel)}`, {
        method: 'POST',
      });
      const d = await r.json();
      setBootstrapStatus(d.message || `Bootstrap started using ${selectedModel}.`);
      checkBootstrapStatus();
    } catch (e) {
      setIsBootstrapping(false);
      setBootstrapStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 8, color: '#ffffff' }}>
        🌐 <span className="grad-text">Skill Taxonomy</span>
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>
        Live canonical skills mined from {'>'}35 roles across Adzuna, JSearch & Jooble
      </p>

      {/* Admin: bootstrap */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#ffffff' }}>🚀 Bootstrap Taxonomy</p>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Fetches all jobs from all APIs, extracts skills, promotes canonical — runs once in background</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {bootstrapStatus && (
            <span style={{ fontSize: 12, color: '#10d98f', background: 'rgba(16,217,143,0.1)', padding: '5px 14px', borderRadius: 99 }}>
              {bootstrapStatus}
            </span>
          )}
          <select
            value={selectedModel}
            disabled={isBootstrapping}
            onChange={e => setSelectedModel(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              fontSize: 13,
              outline: 'none',
              cursor: isBootstrapping ? 'not-allowed' : 'pointer',
              opacity: isBootstrapping ? 0.6 : 1,
            }}
          >
            {TAXONOMY_MODELS.map(([mId, label]) => (
              <option key={mId} value={mId} style={{ background: '#12121e', color: '#fff' }}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={triggerBootstrap}
            disabled={isBootstrapping}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              background: isBootstrapping
                ? 'rgba(91,141,238,0.3)'
                : 'linear-gradient(135deg, #5b8dee, #8b5cf6)',
              border: 'none',
              color: 'white',
              cursor: isBootstrapping ? 'not-allowed' : 'pointer',
              opacity: isBootstrapping ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isBootstrapping ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Running in Background…</span>
              </>
            ) : (
              'Run Bootstrap'
            )}
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
