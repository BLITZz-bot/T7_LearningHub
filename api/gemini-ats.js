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

  const prompt = `You are a strict, top-tier Technical Recruiter and ATS (Applicant Tracking System) Specialist with 15+ years of hiring experience.
I am providing you with a candidate's resume text and their complete academic/profile context.
Your job is to perform an honest, no-sugarcoating reality check and technical evaluation for the target role: "${targetRole}".

Candidate Profile Context:
- Target Role: ${targetRole}
- College Branch: ${branch || 'Not provided'}
- CGPA: ${cgpa || 'Not provided'}
- Passout Year: ${year || 'Not provided'}
- Self-Reported Skills: ${studentSkills ? studentSkills.join(', ') : 'Not provided'}

Resume Text:
${textToAnalyze.substring(0, 15000)}

Perform a deep analysis focusing on these critical dimensions:

1. BRANCH & ROLE ALIGNMENT:
   - Analyze how their academic branch ("${branch}") matches the target role ("${targetRole}").
   - If they are from a non-CS/IT branch (e.g. Mechanical, Civil, Electrical, Chemical) pivoting into Software/Data, acknowledge the hurdle: their projects and technical proof must be twice as strong.
   - If they are CS/IT, hold them to high standard on fundamental CS concepts and depth.

2. PROJECT REALITY CHECK (CRITICAL):
   - Thoroughly inspect every project listed in the resume.
   - Grade project authenticity and complexity: Are these generic tutorial/college beginner projects (e.g., To-Do list, calculator, basic portfolio, simple clone of Netflix/Amazon UI with hardcoded data), or are they real-world engineering projects (full-stack, auth, database design, caching, APIs, deployment, optimization)?
   - Call out their projects by name in the critique and explicitly tell them how recruiters perceive them.

3. IMPACT & QUANTIFICATION:
   - Scan for metrics, percentages, throughput numbers, cost savings, user counts, or quantifiable business impact.
   - Heavily penalize passive bullets like "Assisted in development" or "Worked on frontend".

4. SKILL & KEYWORD MATCH:
   - Cross-check technical competencies required for a modern ${targetRole} against the resume.
   - Identify exact missing industry keywords and tools.

Return EXACTLY this JSON structure and nothing else:
{
  "ats_parseability": 0-100,
  "impact_quantification": 0-100,
  "skill_match": 0-100,
  "formatting_quality": 0-100,
  "overall_readiness": 0-100,
  "action_plan": "A direct, honest, second-person mentor message ('You currently have...', 'Your branch is...', 'Your projects...'). Specifically analyze: (1) their Branch vs ${targetRole} transition reality, (2) an honest critique of their projects (name them and state whether they are beginner clones or production-ready), (3) their CGPA and passout year impact, and (4) soft skills/leadership observed, ending with the exact top 2 actions they must take immediately.",
  "soft_skills_detected": ["List", "of", "soft", "skills", "or", "leadership", "found"],
  "project_critique": "Detailed 2-3 sentence reality check on the quality, tech stack depth, and real-world credibility of their projects.",
  "strengths": [
    "Specific thing working well with context",
    "Another genuine strength found in resume"
  ],
  "issues": [
    {
      "issue": "Specific critical issue in resume or project depth",
      "why_it_matters": "Why an ATS or recruiter will reject it"
    }
  ],
  "keyword_gaps": ["Essential", "Industry", "Keywords", "Missing", "For", "${targetRole}"],
  "suggested_keywords": ["High", "Impact", "Keywords", "To", "Add"],
  "rewrite_suggestions": [
    {
      "original": "A weak or unquantified bullet point extracted from their resume",
      "improved": "An ATS-optimized version using Action Verb + Context + Metric + Result formula",
      "reason": "Why this revision increases ATS score and recruiter callback rate"
    }
  ]
}

Rules for scoring:
- overall_readiness should realistically reflect their hiring probability for "${targetRole}", taking into account their branch, CGPA, project strength, and resume quality.
- Do NOT inflate scores. Be tough, realistic, and constructive.`;

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
