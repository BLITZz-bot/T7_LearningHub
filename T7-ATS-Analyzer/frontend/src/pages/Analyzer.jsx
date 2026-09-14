import { useState } from 'react';
import UploadZone from '../components/UploadZone';
import ScoreCards from '../components/ScoreCards';
import GapList from '../components/GapList';
import RewriteSuggestions from '../components/RewriteSuggestions';
import JDPasteModal from '../components/JDPasteModal';

export default function Analyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);         // upload response
  const [rewrites, setRewrites] = useState(null);
  const [jdMatch, setJdMatch] = useState(null);
  const [showJDModal, setShowJDModal] = useState(false);

  const handleUpload = async (file, role) => {
    setIsLoading(true);
    setError('');
    setResult(null);
    setRewrites(null);
    setJdMatch(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', role);
      formData.append('user_id', 'anonymous');

      const res = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRewrites = async () => {
    if (!result?.resume_id) return;
    setIsRewriting(true);
    try {
      const res = await fetch(`/api/resumes/${result.resume_id}/rewrite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Rewrite failed');
      setRewrites(data.rewrites || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const activeMatch = jdMatch || result?.match;
  const scores = result?.scores;
  const weakBullets = scores?.weak_bullets || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 10 }}>
          <span className="grad-text">T7 ATS Analyzer</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
          Gemini-powered · 4 separate scores · Taxonomy matching · Hallucination-guarded rewrites
        </p>
      </div>

      {/* Upload zone */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
        <UploadZone onUpload={handleUpload} isLoading={isLoading} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24,
          color: '#f87171', fontSize: 14,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, flex: 1 }}>
              📊 Results — <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 16 }}>{result.target_role}</span>
            </h2>
            <button
              onClick={() => setShowJDModal(true)}
              style={{
                padding: '10px 22px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
                background: 'rgba(245,158,66,0.12)', border: '1px solid rgba(245,158,66,0.3)',
                color: '#f59e42', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,66,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,66,0.12)'}
            >
              🎯 Match Against a Job Description
            </button>
          </div>

          {/* 4 Score cards */}
          <ScoreCards scores={scores} />

          {/* Skill gap list */}
          <GapList matchResult={activeMatch} />

          {/* Formatting issues */}
          {scores?.formatting_issues?.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🛠 Formatting Issues</h3>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.formatting_issues.map((issue, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Seniority notes */}
          {scores?.seniority_notes && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>💼 Seniority Assessment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{scores.seniority_notes}</p>
            </div>
          )}

          {/* Rewrites */}
          <RewriteSuggestions
            rewrites={rewrites}
            onRequestRewrites={handleRequestRewrites}
            isLoading={isRewriting}
            hasWeakBullets={weakBullets.length > 0}
          />

          {/* Parsed JSON (collapsible) */}
          <details style={{ marginBottom: 24 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
              🔍 View Parsed Resume JSON
            </summary>
            <pre style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: 20, overflow: 'auto',
              fontSize: 12, color: 'var(--text-secondary)', maxHeight: 400,
            }}>
              {JSON.stringify(result.parsed, null, 2)}
            </pre>
          </details>
        </>
      )}

      {/* JD Modal */}
      {showJDModal && result?.resume_id && (
        <JDPasteModal
          resumeId={result.resume_id}
          onMatchResult={setJdMatch}
          onClose={() => setShowJDModal(false)}
        />
      )}
    </div>
  );
}
