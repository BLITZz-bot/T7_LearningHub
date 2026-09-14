import { useState } from 'react';
import Analyzer from './pages/Analyzer';
import Taxonomy from './pages/Taxonomy';
import ServerWarmupBanner from './components/ServerWarmupBanner';

const NAV = [
  { id: 'analyzer', label: '🤖 Analyzer' },
  { id: 'taxonomy', label: '🌐 Taxonomy' },
];

export default function App({ onAnalysisComplete }) {
  const [page, setPage] = useState('analyzer');

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18 }}>
            T7 ATS<span style={{ color: 'var(--accent-blue)' }}>.</span>ai
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                background: page === n.id ? 'rgba(91,141,238,0.15)' : 'transparent',
                border: page === n.id ? '1px solid rgba(91,141,238,0.3)' : '1px solid transparent',
                color: page === n.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Powered by <span style={{ color: 'var(--accent-blue)' }}>Gemini</span>
        </span>
      </nav>

      {/* Page content */}
      <div style={{ display: page === 'analyzer' ? 'block' : 'none' }}>
        <Analyzer onAnalysisComplete={onAnalysisComplete} />
      </div>
      <div style={{ display: page === 'taxonomy' ? 'block' : 'none' }}>
        <Taxonomy />
      </div>

      {/* Cloud server cold start monitor & animated status */}
      <ServerWarmupBanner />
    </div>
  );
}
