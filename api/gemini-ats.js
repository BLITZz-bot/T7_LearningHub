/**
 * Vercel Serverless Function: /api/gemini-ats
 *
 * Direct Gemini integration for ATS Resume Analysis, replacing LYZR.
 * Supports model fallbacks: 3.6 Flash -> 3.5 Flash -> 3.1 Pro
 */

const SUPPORTED_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
];

async function extractTextFromBase64(base64Data, mimeType = '') {
  if (!base64Data) return '';
  const buffer = Buffer.from(base64Data, 'base64');
  const lowerMime = String(mimeType).toLowerCase();

  const isWordDoc = lowerMime.includes('word') ||
                    lowerMime.includes('officedocument') ||
                    lowerMime.includes('msword') ||
                    lowerMime.includes('docx') ||
                    lowerMime.includes('doc');

  if (isWordDoc) {
    try {
      const mammoth = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const res = await extractor.extractRawText({ buffer });
      if (res?.value && res.value.trim().length > 20) {
        return res.value.trim();
      }
    } catch (docxErr) {
      console.warn('Mammoth Word extraction failed:', docxErr.message);
    }
  }

  try {
    const bytes = new Uint8Array(buffer);
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse(bytes);
    const parsedDoc = await parser.getText();
    if (parsedDoc?.text && parsedDoc.text.trim().length > 20) {
      return parsedDoc.text.trim();
    }
  } catch (err) {
    try {
      const mammoth = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const res = await extractor.extractRawText({ buffer });
      if (res?.value && res.value.trim().length > 20) {
        return res.value.trim();
      }
    } catch (_) {}
  }

  try {
    const raw = buffer.toString('utf-8');
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (printable.length > 50) {
      return printable.trim();
    }
  } catch (_) {}

  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key missing.' });
  }

  const { payload = {} } = req.body || {};
  const { resumeBase64, mimeType, targetRole, studentContext = {} } = payload;

  if (!resumeBase64) return res.status(400).json({ error: 'resumeBase64 is required' });

  try {
    const extractedText = await extractTextFromBase64(resumeBase64, mimeType);
    if (!extractedText) {
      return res.status(400).json({ error: 'Failed to extract readable text from the document.' });
    }

    const { cgpa, year, branch } = studentContext;

    const targetRoleText = targetRole 
      ? `"${targetRole}"` 
      : (branch ? `a role inferred from the student's branch/department (${branch}) and their resume content` : 'a best-fit role inferred from their resume content');

    const prompt = `You are an elite ATS (Applicant Tracking System) Analyzer and Career Mentor.
Analyze the following resume against the target role: ${targetRoleText}.
The student's context:
- CGPA: ${cgpa || 'Not provided'}
- Passout Year: ${year || 'Not provided'}
- Branch/Department: ${branch || 'Not provided'}

Provide a strict JSON response containing the exact metrics below.
Calculate the overall readiness based on the resume content (including soft skills/leadership) and academic stats.
The action_plan should be a personalized paragraph explaining their reality and what to do next to achieve the role.

Required JSON Schema:
{
  "target_role_detected": "String, detected or inferred role",
  "ats_parseability": 0-100,
  "impact_quantification": 0-100,
  "skill_match": 0-100,
  "formatting_quality": 0-100,
  "overall_readiness": 0-100,
  "reality_check_message": "A personalized reality check and action plan paragraph based on CGPA, year, department, and soft skills/leadership.",
  "matched_skills": ["Skill1", "Skill2"],
  "missing_skills": ["Skill3", "Skill4"],
  "soft_skills_detected": ["Leadership", "Communication"]
}

Do not include any markdown fences, just return valid JSON.

Resume Text:
${extractedText.slice(0, 15000)}
`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    };

    let aiData = null;
    let successfulModel = null;
    let lastError = null;

    for (const model of SUPPORTED_MODELS) {
      try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (aiRes.ok) {
          aiData = await aiRes.json();
          successfulModel = model.name;
          break;
        } else {
          const errData = await aiRes.json().catch(() => ({}));
          lastError = new Error(errData?.error?.message || `HTTP ${aiRes.status}`);
          console.warn(`Gemini ATS Model ${model.name} failed: ${lastError.message}`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`Gemini ATS fallback: ${err.message}`);
      }
    }

    if (!aiData) {
      throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
    }

    let resultText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(resultText);

    // Normalize response for frontend
    const result = {
      ...parsed,
      model_used: successfulModel,
      score: parsed.overall_readiness || 0,
      overall_readiness: parsed.overall_readiness || 0,
      summary: parsed.reality_check_message || parsed.action_plan || '',
      reality_check_message: parsed.reality_check_message || parsed.action_plan || '',
      action_plan: parsed.reality_check_message || parsed.action_plan || '',
      matched_skills: parsed.matched_skills || [],
      missing_skills: parsed.missing_skills || [],
      soft_skills_detected: parsed.soft_skills_detected || [],
    };

    return res.status(200).json({ result, agent: 'GeminiATSAnalyzer' });

  } catch (err) {
    console.error('Gemini ATS Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
