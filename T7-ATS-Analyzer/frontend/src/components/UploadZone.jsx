import { useState, useCallback, useEffect } from 'react';

const ALL_ROLES = [
  'Software Development Engineer (SDE) / Backend Developer',
  'Frontend Developer', 'Full Stack Developer', 'Mobile App Developer (Android/iOS)',
  'DevOps Engineer', 'QA / SDET', 'Software Developer', 'IT Support / Systems Administrator',
  'Machine Learning Engineer', 'Data Scientist', 'Data Analyst', 'Data Engineer',
  'NLP Engineer', 'Computer Vision Engineer', 'MLOps Engineer',
  'SOC Analyst', 'Penetration Tester / Ethical Hacker', 'Cloud Engineer (AWS/Azure/GCP)',
  'Cloud Solutions Architect', 'Site Reliability Engineer (SRE)',
];

const MODELS = [
  ['gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite (Default / Fastest)'],
  ['gemini-3.5-flash', 'Gemini 3.5 Flash'],
  ['gemini-3.6-flash', 'Gemini 3.6 Flash'],
  ['gemini-3.7-flash', 'Gemini 3.7 Flash'],
  ['gemini-3.8-flash', 'Gemini 3.8 Flash'],
  ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview (Paid Tier)'],
];

export default function UploadZone({ onUpload, isLoading, hasPrevious, onViewPrevious }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Software Developer');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');
  const [selectedExperience, setSelectedExperience] = useState('Student (Internship)');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (isLoading) {
      setLoadingSeconds(0);
      timer = setInterval(() => {
        setLoadingSeconds(s => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const handleAnalyze = () => {
    if (!selectedFile || isLoading) return;
    onUpload(selectedFile, selectedRole, selectedModel, selectedExperience);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Role selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>
          Target Role
        </label>
        <select
          value={selectedRole}
          disabled={isLoading}
          onChange={e => setSelectedRole(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontSize: 15, outline: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="Software Developer" style={{ background: '#12121e', color: '#ffffff' }}>Software Developer</option>
          {ALL_ROLES.map(r => (
            <option key={r} value={r} style={{ background: '#12121e', color: '#ffffff' }}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Model selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>
          Gemini Model
        </label>
        <select
          value={selectedModel}
          disabled={isLoading}
          onChange={e => setSelectedModel(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            color: '#ffffff', fontSize: 15, outline: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {MODELS.map(([id, label]) => (
            <option key={id} value={id} style={{ background: '#12121e', color: '#ffffff', padding: '8px' }}>
              {label}
            </option>
          ))}
        </select>
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
          Flash models are recommended for fast, high-accuracy resume analysis.
        </p>
        {selectedModel.includes('pro') && (
          <p style={{ color: '#f59e42', fontSize: 12, marginTop: 6 }}>
            Note: Pro preview requires a paid tier billing project on Google AI Studio.
          </p>
        )}
      </div>

      {/* Experience Level selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>
          I am a...
        </label>
        <select
          value={selectedExperience}
          disabled={isLoading}
          onChange={e => setSelectedExperience(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontSize: 15, outline: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="Student (Internship)" style={{ background: '#12121e', color: '#ffffff' }}>Student (Looking for Internships)</option>
          <option value="Fresher (Entry-Level)" style={{ background: '#12121e', color: '#ffffff' }}>Fresher (Looking for Entry-Level)</option>
          <option value="Professional (Experienced)" style={{ background: '#12121e', color: '#ffffff' }}>Professional (Looking for Experienced Roles)</option>
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); if (!isLoading) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => { if (!isLoading) document.getElementById('resume-file-input').click(); }}
        style={{
          border: `2px dashed ${selectedFile ? 'var(--accent-blue)' : isDragging ? 'var(--accent-blue)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '44px 32px',
          textAlign: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          background: isDragging ? 'rgba(91,141,238,0.08)' : selectedFile ? 'rgba(91,141,238,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.25s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{
                width: 56, height: 56,
                border: '3px solid rgba(91,141,238,0.18)',
                borderTop: '3px solid var(--accent-blue)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {loadingSeconds}s
              </div>
            </div>

            <div>
              <p style={{ color: 'var(--accent-blue)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                {loadingSeconds < 5
                  ? 'Parsing resume structure & text…'
                  : loadingSeconds < 14
                    ? 'Evaluating with Gemini & computing ATS score…'
                    : 'Cloud server is waking up — almost ready…'}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>
                {loadingSeconds >= 14
                  ? 'Render free tier takes ~20–30s on first request after sleep. Hold tight!'
                  : 'Structural parsing · Skill taxonomy match · Dual-layer scoring'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 44, marginBottom: 12 }}>
              {selectedFile ? '📄' : '📤'}
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
              {fileName ? `✅ ${fileName}` : 'Drop your resume here or click to browse'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              {selectedFile ? 'Click anytime to choose a different file' : 'PDF or DOCX · Max 10MB'}
            </p>
          </>
        )}
      </div>

      <input
        id="resume-file-input"
        type="file"
        accept=".pdf,.docx,.doc"
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e.target.files?.[0])}
      />

      {/* Analyze Resume Button */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isLoading}
          style={{
            width: '100%',
            padding: '16px 28px',
            borderRadius: 'var(--radius-md)',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'inherit',
            letterSpacing: '0.3px',
            cursor: !selectedFile || isLoading ? 'not-allowed' : 'pointer',
            opacity: !selectedFile ? 0.5 : 1,
            background: isLoading
              ? 'linear-gradient(135deg, rgba(91,141,238,0.5), rgba(139,92,246,0.5))'
              : selectedFile
                ? 'linear-gradient(135deg, #5b8dee 0%, #8b5cf6 100%)'
                : 'rgba(255,255,255,0.06)',
            border: selectedFile && !isLoading ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
            color: '#ffffff',
            boxShadow: selectedFile && !isLoading ? '0 6px 24px rgba(91,141,238,0.35)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {isLoading ? (
            <>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTop: '2.5px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Analyzing Resume… ({loadingSeconds}s)</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>⚡</span>
              <span>Analyze Resume</span>
              {fileName && <span style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>({fileName})</span>}
            </>
          )}
        </button>

        {hasPrevious && !selectedFile && !isLoading && (
          <button
            onClick={onViewPrevious}
            style={{
              width: '100%',
              padding: '14px 28px',
              marginTop: 12,
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🕒 View Previous Analysis
          </button>
        )}

        {!selectedFile && !hasPrevious && (
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            Select or drag a resume file above to enable analysis
          </p>
        )}
      </div>
    </div>
  );
}
