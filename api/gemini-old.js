/**
 * Vercel Serverless Function: /api/gemini
 *
 * T7 AI MENTOR — Powered by Google Gemini Flash
 *
 * A context-aware AI mentor that knows EVERYTHING about the student:
 *   - Career profile & readiness score (from Lyzr Agent A)
 *   - ATS resume audit & keyword gaps (from Lyzr Agent B)
 *   - Skills they have & skills missing
 *   - Their full learning roadmap
 *   - YouTube learning history
 *   - Academic profile (branch, year, CGPA)
 *
 * POST body:
 *   {
 *     message: string,              // Student's question
 *     chatHistory: Array,           // Previous messages for context
 *     studentContext: {             // All student data
 *       name, branch, year, cgpa,
 *       targetRole, readinessScore,
 *       matchedSkills, missingSkills,
 *       atsScore, atsGaps, atsKeywordGaps, atsStrengths,
 *       roadmap, quickWins,
 *       videoCount, ytSkills,
 *       honestAssessment, finalOutcome
 *     }
 *   }
 */

const SUPPORTED_MODELS = {
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    tag: '🚀 Next-Gen Flagship',
  },
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
    tag: '⚡ Ultra Fast Reasoning',
  },
  'gemini-3.1-pro-preview': {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent',
    tag: '🧠 Deep Intelligence',
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    tag: '⚖️ Default (Balanced)',
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    tag: '⚡ Stable Fallback',
  },
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
    tag: '🪶 Ultra Low Latency',
  },
  'gemini-flash-latest': {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    tag: '🔄 Auto-Updated Flash',
  },
};

/**
 * Build a rich, personal system prompt for the student
 */
function buildSystemPrompt(ctx) {
  const {
    name,
    branch,
    year,
    cgpa,
    targetRole,
    readinessScore,
    matchedSkills = [],
    missingSkills = [],
    atsScore,
    atsParseability,
    impactQuantification,
    skillMatch,
    formattingQuality,
    realityCheckMessage,
    softSkills = [],
    atsSummary,
    atsGaps = [],
    atsKeywordGaps = [],
    atsStrengths = [],
    atsRewrites = [],
    roadmap = [],
    quickWins = [],
    videoCount = 0,
    ytSkills = [],
    honestAssessment,
    finalOutcome,
    resumeFileName,
  } = ctx || {};

  const skillsHave = Array.isArray(matchedSkills) ? matchedSkills.join(', ') : matchedSkills;
  const skillsMissing = Array.isArray(missingSkills) ? missingSkills.join(', ') : missingSkills;
  const atsGapsList = Array.isArray(atsGaps) ? atsGaps.map(g => typeof g === 'object' ? (g.issue || g.description || JSON.stringify(g)) : g).join('\n  - ') : '';
  const keywordsList = Array.isArray(atsKeywordGaps) ? atsKeywordGaps.map(k => typeof k === 'object' ? (k.keyword || k.name || k.skill || JSON.stringify(k)) : k).join(', ') : '';
  const strengthsList = Array.isArray(atsStrengths) ? atsStrengths.map(s => typeof s === 'object' ? (s.point || s.title || s.strength || JSON.stringify(s)) : s).join('\n  - ') : '';
  const ytSkillsList = Array.isArray(ytSkills) ? ytSkills.join(', ') : ytSkills;
  const quickWinsList = Array.isArray(quickWins) ? quickWins.map(w => typeof w === 'object' ? (w.action || w.tip || JSON.stringify(w)) : w).slice(0, 5).join('\n  - ') : '';
  const softSkillsList = Array.isArray(softSkills) ? softSkills.join(', ') : (softSkills || 'None detected');

  const roadmapSummary = Array.isArray(roadmap) ? roadmap.map((p, i) => {
    const title = p.title || p.milestone || p.focus || `Phase ${i + 1}`;
    const duration = p.duration || (p.duration_weeks ? `${p.duration_weeks} weeks` : '4 weeks');
    const skills = Array.isArray(p.skills_covered) ? p.skills_covered.join(', ') : (Array.isArray(p.skills) ? p.skills.join(', ') : '');
    return `  Phase ${i + 1}: ${title} (${duration})${skills ? ` — Skills: ${skills}` : ''}`;
  }).join('\n') : '';

  return `You are T7 AI MENTOR, a personal career coach and academic guide for the T7 Learning Hub platform.

You have been assigned to help ONE specific student. Here is EVERYTHING you know about them:

═══════════════════════════════════════════════════
STUDENT PROFILE
═══════════════════════════════════════════════════
Name: ${name || 'Student'}
Branch: ${branch || 'Not specified'}
Year: ${year || 'Not specified'}
CGPA: ${cgpa || 'Not specified'}
Target Role: ${targetRole || 'Software Developer'}

═══════════════════════════════════════════════════
CAREER READINESS (from AI Analysis)
═══════════════════════════════════════════════════
Overall Readiness Score: ${readinessScore !== undefined ? `${readinessScore}%` : 'Not analyzed yet'}
AI Assessment: ${honestAssessment || 'Not available'}
${finalOutcome ? `Final Goal: ${finalOutcome}` : ''}

Skills They Have: ${skillsHave || 'None listed'}
Skills They Are Missing: ${skillsMissing || 'None listed'}

${quickWinsList ? `Quick Wins (Do These First):\n  - ${quickWinsList}` : ''}

═══════════════════════════════════════════════════
LEARNING ROADMAP
═══════════════════════════════════════════════════
${roadmapSummary || 'No roadmap generated yet'}

═══════════════════════════════════════════════════
ATS RESUME AUDIT (from Gemini ATS Analysis)
═══════════════════════════════════════════════════
${resumeFileName ? `Resume File: ${resumeFileName}` : 'Resume: Not uploaded yet'}
ATS Overall Readiness: ${atsScore !== undefined && atsScore !== null ? `${atsScore}%` : 'Not analyzed yet'}
${atsParseability !== undefined && atsParseability !== null ? `ATS Parseability: ${atsParseability}%` : ''}
${impactQuantification !== undefined && impactQuantification !== null ? `Impact & Quantification: ${impactQuantification}%` : ''}
${skillMatch !== undefined && skillMatch !== null ? `Skill Match: ${skillMatch}%` : ''}
${formattingQuality !== undefined && formattingQuality !== null ? `Formatting Quality: ${formattingQuality}%` : ''}
Soft Skills & Leadership: ${softSkillsList}
${realityCheckMessage ? `Gemini Mentor Reality Check: ${realityCheckMessage}` : ''}
${atsSummary ? `Summary: ${atsSummary}` : ''}

Resume Strengths:
  - ${strengthsList || 'Not analyzed yet'}

Issues To Fix:
  - ${atsGapsList || 'Not analyzed yet'}

Missing Keywords (add these to resume):
${keywordsList || 'Not analyzed yet'}

${Array.isArray(atsRewrites) && atsRewrites.length > 0 ? `Rewrite Suggestions Available: ${atsRewrites.length} bullet point rewrites generated` : ''}

═══════════════════════════════════════════════════
YOUTUBE LEARNING ACTIVITY
═══════════════════════════════════════════════════
Videos Analyzed: ${videoCount}
Skills Detected From Videos: ${ytSkillsList || 'None yet'}

═══════════════════════════════════════════════════
YOUR ROLE AS T7 AI MENTOR
═══════════════════════════════════════════════════
You are a supportive, honest, and highly knowledgeable AI mentor. Your job is to:

1. Answer ANY question the student has about their career, skills, resume, roadmap, or placement readiness — using the data above to give PERSONALIZED answers.
2. Give specific, actionable advice — not vague suggestions.
3. Be encouraging but HONEST. If a student has a low score, explain why and what to do.
4. When asked about skills, always reference THEIR specific missing/matched skills.
5. When asked about the resume, reference THEIR actual ATS score and specific gaps.
6. Keep answers concise but complete. Use bullet points for steps or lists.
7. If something is not in the data (e.g., resume not uploaded), kindly guide them to do it.
8. You can also help with:
   - Interview preparation tips for their target role
   - How to write better resume bullets
   - Which projects to build
   - How to use LinkedIn effectively
   - General coding / DSA advice
   - Career switch guidance
   - Salary expectations for their target role

IMPORTANT: Always address the student personally. Use their name if available. Reference their ACTUAL data — scores, skills, role — to make every answer feel custom-made for them.

Respond in a friendly, mentoring tone. Keep responses focused and practical.`;
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
      message: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.',
    });
  }

  const { message, chatHistory = [], studentContext = {}, model: requestedModel, action, jobId, jobUrl, fallbackDescription } = req.body || {};

  // Action: scrape_and_extract_skills
  if (action === 'scrape_and_extract_skills') {
    if (!jobId || !jobUrl) return res.status(400).json({ error: 'jobId and jobUrl are required' });
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, '');
      const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
      
      let supabase = null;
      if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      }

      // 1. Check Cache
      if (supabase) {
        const { data: cached } = await supabase
          .from('t7_scraped_jobs')
          .select('extracted_skills')
          .eq('job_id', jobId)
          .maybeSingle();
          
        if (cached && cached.extracted_skills) {
          return res.status(200).json({ skills: cached.extracted_skills, source: 'cache' });
        }
      }

      // 2. Scrape via Python Playwright Backend (Instead of Jina)
      let jobText = fallbackDescription || '';
      try {
        // Use environment variable for the backend URL, defaulting to local during development
        const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        const scrapeResponse = await fetch(`${pythonBackendUrl}/scraping/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: jobUrl })
        });
        
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          
          // Check if Cloudflare blocked us
          const isBlocked = scrapeData.text && (
            scrapeData.text.includes("suspicious behaviour") || 
            scrapeData.text.includes("Cloudflare") ||
            scrapeData.text.includes("Just a moment...")
          );

          if (scrapeData.text && scrapeData.text.length > 200 && !isBlocked) {
            jobText = scrapeData.text;
          } else {
            console.warn(`Scraped text blocked or too short for ${jobUrl}, falling back to description.`);
          }
        } else {
          console.warn(`Python Scraper failed for ${jobUrl} (Status: ${scrapeResponse.status}), falling back to description.`);
        }
      } catch (err) {
        console.warn('Python scraper fetch error:', err.message);
      }

      // 3. Extract via Gemini
      const prompt = `Extract all technical skills, frameworks, tools, and programming languages required in the following job posting text.
Return ONLY a valid JSON array of strings (e.g., ["React", "TypeScript", "Git"]). Do not include any markdown formatting or extra text.
Job Text:
${jobText.substring(0, 15000)}`;

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      };

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!aiRes.ok) throw new Error('Gemini API extraction failed');
      const aiData = await aiRes.json();
      let resultText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      
      // Clean potential markdown blocks
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let extractedSkills = [];
      try {
        extractedSkills = JSON.parse(resultText);
        if (!Array.isArray(extractedSkills)) extractedSkills = [];
      } catch (e) {
        console.error('Failed to parse Gemini output:', resultText);
      }

      // 4. Save to Cache
      if (supabase && extractedSkills.length > 0) {
        await supabase.from('t7_scraped_jobs').upsert({
          job_id: jobId,
          url: jobUrl,
          extracted_skills: extractedSkills,
          created_at: new Date().toISOString()
        }).catch(e => console.warn('Cache save failed:', e.message));
      }

      return res.status(200).json({ skills: extractedSkills, source: 'ai' });

    } catch (err) {
      console.error('Extraction error:', err);
      return res.status(500).json({ error: 'Failed to extract skills', detail: err.message });
    }
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Determine requested model or default to 3.8-flash
  const activeModelKey = SUPPORTED_MODELS[requestedModel] ? requestedModel : 'gemini-3.8-flash';
  let targetModel = SUPPORTED_MODELS[activeModelKey];

  try {
    const systemPrompt = buildSystemPrompt(studentContext);

    // Build Gemini conversation history
    const contents = [];

    // Add previous chat history
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      for (const turn of chatHistory) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Add the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    let response = await fetch(`${targetModel.endpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // If selected model is not available or errors out (e.g. 404), fallback to gemini-3.5-flash
    if (!response.ok && activeModelKey !== 'gemini-3.5-flash') {
      console.warn(`[/api/gemini] Model ${activeModelKey} failed with status ${response.status}. Falling back to gemini-3.5-flash.`);
      targetModel = SUPPORTED_MODELS['gemini-3.5-flash'];
      response = await fetch(`${targetModel.endpoint}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[/api/gemini] Gemini API error:', errData);
      throw new Error(errData?.error?.message || `Gemini API error (${response.status})`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';

    return res.status(200).json({
      text,
      model: targetModel.id,
      modelName: targetModel.name,
    });

  } catch (err) {
    console.error('[/api/gemini] Unhandled error:', err);
    return res.status(500).json({ error: 'Gemini request failed', detail: err.message });
  }
}
