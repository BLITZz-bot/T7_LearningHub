import React, { useEffect, useState } from 'react';
import AtsApp from '../../../T7-ATS-Analyzer/frontend/src/App';
import '../../../T7-ATS-Analyzer/frontend/src/index.css';
import FullJobMarketView from './FullJobMarketView';

export default function AtsPage() {
  const [atsResult, setAtsResult] = useState(null);

  useEffect(() => {
    document.title = 'T7 ATS Resume Analyzer | Powered by Gemini';
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', color: '#f1f5f9' }}>
      <AtsApp onAnalysisComplete={setAtsResult} />
      
      {atsResult && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <FullJobMarketView 
            careerInterest="all"
            experienceLevel={atsResult.experience_level || 'all'}
          />
        </div>
      )}
    </div>
  );
}
