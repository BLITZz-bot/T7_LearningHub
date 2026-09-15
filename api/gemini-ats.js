/**
 * Vercel Serverless Function: /api/gemini-ats
 *
 * Direct Gemini integration for the Dashboard ATS Analyzer, bypassing Lyzr.
 * Returns the exact JSON structure needed for the circular rings UI.
 */

// Fallback chain for Gemini models
const MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro'
];

async function callGemini(prompt, model, apiKey) {
  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Gemini Error (${res.status}): ${JSON.stringify(errData)}`);
  }

  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
}

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
      if (res?.value && res.value.trim().length > 20) return res.value.trim();
    } catch (docxErr) {
      console.warn('Mammoth extraction failed:', docxErr.message);
    }
  }

  try {
    const bytes = new Uint8Array(buffer);
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse(bytes);
    const parsedDoc = await parser.getText();
    if (parsedDoc?.text && parsedDoc.text.trim().length > 20) return parsedDoc.text.trim();
  } catch (err) {}

  try {
    const raw = buffer.toString('utf-8');
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (printable.length > 50) return printable.trim();
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
    return res.status(503).json({
      error: 'GEMINI_NOT_CONFIGURED',
      message: 'Gemini API key not configured.',
    });
  }

  const { resumeBase64, mimeType, extractedText, cgpa, year, branch, targetRole, studentSkills } = req.body || {};

  let textToAnalyze = extractedText;
  if (!textToAnalyze && resumeBase64) {
    textToAnalyze = await extractTextFromBase64(resumeBase64, mimeType);
  }

  if (!textToAnalyze) {
    return res.status(400).json({ error: 'resumeBase64 or extractedText is required' });
  }

  const prompt = `You are an expert Technical Recruiter and ATS (Applicant Tracking System) Analyzer.
I am providing you with a candidate's resume text and their academic context.
Your job is to analyze the resume for the target role: "${targetRole}".

Academic Context:
- CGPA: ${cgpa || 'Not provided'}
- Passout Year: ${year || 'Not provided'}
- Branch: ${branch || 'Not provided'}
- Current Skills: ${studentSkills ? studentSkills.join(', ') : 'Not provided'}

Resume Text:
${textToAnalyze.substring(0, 15000)}

Analyze the resume and return EXACTLY this JSON structure, and nothing else:
{
  "ats_parseability": 0-100,
  "impact_quantification": 0-100,
  "skill_match": 0-100,
  "formatting_quality": 0-100,
  "overall_readiness": 0-100,
  "action_plan": "A personalized mentor message explaining their reality check. Incorporate their CGPA, Branch, Year, and any soft skills or leadership qualities found in the resume. Be honest, direct, and actionable.",
  "soft_skills_detected": ["List", "of", "soft", "skills", "found"]
}

Rules for scoring:
- overall_readiness should incorporate their academic stats and soft skills, not just the technical resume.
- Be highly critical of impact_quantification if they don't use numbers/metrics.
- The action_plan MUST be written in the second person ("You have...", "Your CGPA is...") like a mentor talking to the student.`;

  let lastError = null;
  for (const model of MODELS) {
    try {
      const jsonResult = await callGemini(prompt, model, GEMINI_API_KEY);
      return res.status(200).json({ result: jsonResult, modelUsed: model });
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err.message;
      // Try next model
    }
  }

  return res.status(500).json({ error: 'All Gemini models failed', detail: lastError });
}
