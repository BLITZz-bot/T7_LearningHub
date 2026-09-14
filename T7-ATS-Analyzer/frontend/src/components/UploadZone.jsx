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

export default function UploadZone({ onUpload, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Software Developer');
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

  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    onUpload(file, selectedRole);
  }, [onUpload, selectedRole]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Role selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
          Target Role
        </label>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 15, outline: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="Software Developer">Software Developer</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('resume-file-input').click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '52px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'rgba(91,141,238,0.06)' : 'rgba(255,255,255,0.02)',
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
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {loadingSeconds >= 14
                  ? 'Render free tier takes ~20–30s on first request after sleep. Hold tight!'
                  : 'Structural parsing · Skill taxonomy match · Dual-layer scoring'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12, filter: 'grayscale(0.3)' }}>📄</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              {fileName ? `✅ ${fileName}` : 'Drop your resume here'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              PDF or DOCX · Max 10MB · Click to browse
            </p>
          </>
        )}
      </div>

      <input
        id="resume-file-input"
        type="file"
        accept=".pdf,.docx,.doc"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
