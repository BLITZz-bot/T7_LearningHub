const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    let encoded = reader.result.toString();
    const mimeMatch = encoded.match(/^data:(.*);base64,/);
    let mimeType = 'application/pdf';
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      encoded = encoded.replace(/^data:.*;base64,/, '');
    }
    resolve({ base64: encoded, mimeType });
  };
  reader.onerror = error => reject(error);
});

export const analyzeResumeGemini = async ({
  resumeFile,
  targetRole = null,
  studentContext = {},
  userId = null,
}) => {
  if (!resumeFile) throw new Error('Resume file is required');

  const { base64, mimeType } = await fileToBase64(resumeFile);

  const res = await fetch('/api/gemini-ats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: {
        resumeBase64: base64,
        mimeType,
        targetRole: typeof targetRole === 'string' ? targetRole : targetRole?.role_name || null,
        studentContext,
        userId,
      }
    })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Gemini ATS proxy error (${res.status})`);
  }

  const data = await res.json();
  const result = data.result;

  return {
    ...result,
    ats_analysis: {
      ...result,
      score: result.overall_readiness || 0,
      summary: result.action_plan || '',
    },
    resume_meta: {
      file_name: resumeFile.name,
      file_type: resumeFile.type || 'application/pdf',
    },
    _agent: 'GeminiATSAnalyzer',
  };
};
