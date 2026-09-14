import React, { useEffect } from 'react';
import AtsApp from '../../../T7-ATS-Analyzer/frontend/src/App';
import '../../../T7-ATS-Analyzer/frontend/src/index.css';

export default function AtsPage() {
  useEffect(() => {
    document.title = 'T7 ATS Resume Analyzer | Powered by Gemini';
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', color: '#f1f5f9' }}>
      <AtsApp />
    </div>
  );
}
