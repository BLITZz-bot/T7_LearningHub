import { useState } from 'react';

export default function JDPasteModal({ resumeId, onMatchResult, onClose }) {
  const [jdText, setJdText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMatch = async () => {
    if (!jdText.trim()) { setError('Paste a job description first'); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText, jd_only: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Match failed');
      onMatchResult(data.jd_overlay || data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card animate-fade-up" style={{ width: '100%', maxWidth: 640, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>🎯 JD Overlay Match</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Paste any job description and we'll extract its required skills, embed them with Gemini, and compare against your resume — instantly.
        </p>

        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          placeholder="Paste job description here…"
          rows={12}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', lineHeight: 1.6, marginBottom: 16,
          }}
        />

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠ {error}</p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', borderRadius: 'var(--radius-md)', fontSize: 14,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleMatch} disabled={isLoading} style={{
            padding: '10px 26px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
            background: isLoading ? 'rgba(91,141,238,0.2)' : 'linear-gradient(135deg, #5b8dee, #8b5cf6)',
            border: 'none', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer',
          }}>
            {isLoading ? 'Matching…' : 'Match Against My Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}
