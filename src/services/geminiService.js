/**
 * Gemini AI Service — Secure Client-Side Proxy Layer
 *
 * All Gemini API calls are routed through the secure Vercel serverless
 * function at /api/gemini. API keys are NEVER stored in or exposed by
 * this file or the browser bundle.
 */

// ----------------------------------------------------------------
// Curated list of standard Gemini models (used for UI dropdowns etc.)
// ----------------------------------------------------------------
export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', tag: 'High', speedLabel: 'High', isFlash: true },
  { id: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', tag: 'High Reasoning', speedLabel: 'Deep Reasoning', isPro: true },
  { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite', tag: 'Ultra Fast', speedLabel: 'Ultra Fast', isFlash: true }
];

/**
 * Internal helper: POST to /api/gemini proxy
 */
const callProxy = async (action, payload = {}) => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Gemini proxy error (${res.status})`);
  return data;
};

/**
 * Fetch real-time available Gemini models via /api/gemini proxy
 *
 * @param {string} customApiKey - Optional user's personal key (sent securely in body)
 * @returns {Promise<Array>} - List of formatted model objects
 */
export const fetchAvailableGeminiModels = async (customApiKey = null) => {
  try {
    const data = await callProxy('listModels', { customApiKey });
    if (!data?.models || !Array.isArray(data.models)) return DEFAULT_GEMINI_MODELS;

    const filtered = data.models
      .filter(m => {
        const name = m.name?.toLowerCase() || '';
        const methods = m.supportedGenerationMethods || [];
        return name.includes('gemini') &&
               methods.includes('generateContent') &&
               !name.includes('vision') &&
               !name.includes('embedding');
      })
      .map(m => {
        const rawId = m.name.replace(/^models\//, '');
        const isFlash = rawId.includes('flash');
        const isPro = rawId.includes('pro');
        const isHigh = rawId.includes('3.7') || rawId.includes('pro');
        return {
          id: rawId,
          displayName: m.displayName || rawId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: m.description || '',
          tag: isHigh ? 'High' : (isFlash ? 'Fast' : 'General'),
          speedLabel: isFlash ? 'Fast' : (isPro ? 'Deep Reasoning' : 'Standard'),
          isFlash,
          isPro,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        };
      });

    return filtered.length > 0 ? filtered : DEFAULT_GEMINI_MODELS;
  } catch (err) {
    console.warn('Error fetching live models:', err);
    return DEFAULT_GEMINI_MODELS;
  }
};

/**
 * Verify if a Gemini API key is valid (proxied securely through /api/gemini)
 *
 * @param {string} apiKey
 * @returns {Promise<{valid: boolean, totalModels?: number, error?: string}>}
 */
export const verifyGeminiApiKey = async (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { valid: false, error: 'API key is too short or empty' };
  }
  try {
    const data = await callProxy('verifyKey', { customApiKey: apiKey.trim() });
    return data;
  } catch (err) {
    return { valid: false, error: err.message || 'Network error verifying API key' };
  }
};

/**
 * Convert a File object to base64 for sending to the proxy
 */
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    // reader.result is "data:<mimeType>;base64,<data>"
    const base64 = reader.result.split(',')[1];
    resolve({ base64, mimeType: file.type });
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * Analyze skill gap using Gemini AI (via secure /api/gemini proxy)
 *
 * @param {string[]} studentSkills
 * @param {object} selectedRole
 * @param {object[]} allRoles
 * @param {File|null} resumeFile
 * @param {string|null} customApiKey - User's personal key from profile settings
 * @param {string|null} preferredModel
 */
export const analyzeT7LearningHub = async (
  studentSkills,
  selectedRole,
  allRoles,
  resumeFile = null,
  customApiKey = null,
  preferredModel = null
) => {
  try {
    const prompt = SKILL_GAP_PROMPT
      .replace('{{STUDENT_SKILLS}}', JSON.stringify(studentSkills, null, 2))
      .replace('{{CAREER_ROLE}}', selectedRole.role_name)
      .replace('{{INDUSTRY_SKILLS_JSON}}', JSON.stringify({
        role_name: selectedRole.role_name,
        description: selectedRole.description,
        required_skills: selectedRole.required_skills,
        priority_skills: selectedRole.priority_skills
      }, null, 2));

    let fileBase64 = null;
    let mimeType = null;
    if (resumeFile) {
      const encoded = await fileToBase64(resumeFile);
      fileBase64 = encoded.base64;
      mimeType = encoded.mimeType;
    }

    const data = await callProxy('generateContent', {
      prompt,
      fileBase64,
      mimeType,
      preferredModel,
      customApiKey,
    });

    const text = data.text;
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    const analysisResult = JSON.parse(jsonText.trim());
    return {
      career_role: analysisResult.career_role || selectedRole.role_name,
      readiness_score: Math.min(100, Math.max(0, analysisResult.readiness_score || 0)),
      score_breakdown: analysisResult.score_breakdown || {},
      honest_assessment: analysisResult.honest_assessment || '',
      matched_skills: analysisResult.matched_skills || [],
      missing_skills: analysisResult.missing_skills || [],
      recommended_skills: analysisResult.recommended_skills || [],
      skill_priority_order: analysisResult.skill_priority_order || analysisResult.recommended_skills || [],
      learning_roadmap: analysisResult.learning_roadmap || [],
      quick_wins: analysisResult.quick_wins || [],
      resume_tips: analysisResult.resume_tips || [],
      linkedin_tips: analysisResult.linkedin_tips || [],
      motivation: analysisResult.motivation || '',
      final_outcome: analysisResult.final_outcome || '',
      ats_analysis: analysisResult.ats_analysis
        ? {
            score: Math.min(100, Math.max(0, analysisResult.ats_analysis.score || 0)),
            summary: analysisResult.ats_analysis.summary || '',
            strengths: analysisResult.ats_analysis.strengths || [],
            issues: analysisResult.ats_analysis.issues || [],
            keyword_gaps: analysisResult.ats_analysis.keyword_gaps || [],
            suggested_keywords: analysisResult.ats_analysis.suggested_keywords || [],
            section_scores: normalizeSectionScores(analysisResult.ats_analysis.section_scores),
            rewrite_suggestions: analysisResult.ats_analysis.rewrite_suggestions || []
          }
        : null,
      resume_meta: resumeFile
        ? { file_name: resumeFile.name, file_type: resumeFile.type || 'application/octet-stream' }
        : null
    };
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return generateFallbackAnalysis(studentSkills, selectedRole, resumeFile);
  }
};

/**
 * Perform a standalone ATS analysis against a selected career role (via /api/gemini proxy)
 */
export const analyzeResumeOnly = async (resumeFile, selectedRole, customApiKey = null, preferredModel = null) => {
  const prompt = `Analyze this resume against the "${selectedRole.role_name}" role.
  Role Skills: ${selectedRole.required_skills.map(s => s.name).join(', ')}

  CRITICAL INSTRUCTION: First, strictly verify if the uploaded file is actually a resume. If the document is clearly NOT a resume (e.g., study notes, random text, code, homework), you MUST return a score of 0, set all section_scores to 0, and make the 'summary' explicitly say: "The uploaded document does not appear to be a valid resume."

  Return ONLY a valid JSON object EXACTLY like this (no markdown, no other text):
  {
    "score": 65,
    "summary": "Short evaluation",
    "strengths": ["...", "..."],
    "issues": ["...", "..."],
    "keyword_gaps": ["...", "..."],
    "suggested_keywords": ["...", "..."],
    "section_scores": {
      "formatting": 70,
      "keyword_match": 50,
      "content_strength": 60,
      "impact": 55
    },
    "rewrite_suggestions": ["...", "..."]
  }`;

  const encoded = await fileToBase64(resumeFile);

  try {
    const data = await callProxy('analyzeAts', {
      prompt,
      fileBase64: encoded.base64,
      mimeType: encoded.mimeType,
      preferredModel,
      customApiKey,
    });

    const text = data.text;
    if (!text) throw new Error('Empty response from AI');

    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText.trim());
    } catch {
      parsedResult = {
        score: 0,
        summary: 'The uploaded document does not appear to be a valid resume or the AI rejected it.',
        strengths: [],
        issues: ['Could not extract structured data.'],
        keyword_gaps: [],
        suggested_keywords: [],
        section_scores: { formatting: 0, keyword_match: 0, content_strength: 0, impact: 0 },
        rewrite_suggestions: []
      };
    }

    return {
      ats_analysis: parsedResult,
      resume_meta: {
        file_name: resumeFile.name,
        file_type: resumeFile.type,
        size_kb: Math.round(resumeFile.size / 1024)
      }
    };
  } catch (err) {
    console.error('ATS analysis error:', err);
    throw err;
  }
};

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const normalizeSectionScores = (raw = {}) => ({
  formatting: Math.min(100, Math.max(0, raw?.formatting || 0)),
  keyword_match: Math.min(100, Math.max(0, raw?.keyword_match || 0)),
  content_strength: Math.min(100, Math.max(0, raw?.content_strength || 0)),
  impact: Math.min(100, Math.max(0, raw?.impact || 0)),
});

/**
 * Fallback analysis when Gemini API is unavailable
 */
const generateFallbackAnalysis = (studentSkills, selectedRole, resumeFile = null) => {
  const requiredSkillNames = selectedRole.required_skills.map(s => s.name);
  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  const matched = requiredSkillNames.filter(skill => studentSkillsLower.includes(skill.toLowerCase()));
  const missing = requiredSkillNames.filter(skill => !studentSkillsLower.includes(skill.toLowerCase()));
  const priorityMatched = selectedRole.priority_skills.filter(skill => studentSkillsLower.includes(skill.toLowerCase()));
  const readinessScore = Math.round(
    (matched.length / requiredSkillNames.length) * 60 +
    (priorityMatched.length / selectedRole.priority_skills.length) * 40
  );
  const highPriorityMissing = missing.filter(skill =>
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'high')
  );
  const mediumPriorityMissing = missing.filter(skill =>
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'medium')
  );
  const roadmap = [];
  if (highPriorityMissing.length > 0) {
    roadmap.push({ month: 'Month 1-2', focus: 'Core Foundation Skills', skills: highPriorityMissing.slice(0, 3), resources: ['Official documentation', 'Free YouTube tutorials', 'Practice projects'] });
  }
  if (highPriorityMissing.length > 3 || mediumPriorityMissing.length > 0) {
    roadmap.push({ month: 'Month 3-4', focus: 'Intermediate Skills Development', skills: [...highPriorityMissing.slice(3), ...mediumPriorityMissing.slice(0, 2)], resources: ['Build mini-projects', 'Online coding platforms', 'Open source contributions'] });
  }
  roadmap.push({ month: 'Month 5-6', focus: 'Project Building & Interview Prep', skills: ['Portfolio Development', 'Interview Skills'], resources: ['Build 2-3 projects', 'LeetCode practice', 'Mock interviews'] });
  return {
    career_role: selectedRole.role_name,
    readiness_score: readinessScore,
    score_breakdown: { technical_skills: readinessScore, projects: Math.max(20, readinessScore - 10), interview_readiness: Math.max(25, readinessScore - 5) },
    honest_assessment: matched.length > 0
      ? `You already have some alignment with ${selectedRole.role_name}, but there are still important gaps to close before placements.`
      : `You are still at the starting point for ${selectedRole.role_name}, so focus on the highest-priority fundamentals first.`,
    matched_skills: matched,
    missing_skills: missing,
    recommended_skills: highPriorityMissing.slice(0, 5),
    skill_priority_order: highPriorityMissing.slice(0, 5).map(skill => ({ skill, reason: 'High-priority requirement for this role', time_to_learn: '2-4 weeks', difficulty: 'Medium' })),
    learning_roadmap: roadmap,
    quick_wins: highPriorityMissing.slice(0, 3).map(skill => ({ task: `Start practicing ${skill}`, time: '1-2 hours', impact: `Improves alignment with ${selectedRole.role_name}` })),
    resume_tips: ['Use measurable impact in project bullet points', 'Add keywords from the job role naturally in skills and projects'],
    linkedin_tips: [`Mention your interest in ${selectedRole.role_name} clearly in the headline`, 'Post weekly progress about projects and learning milestones'],
    motivation: 'Consistent weekly effort will compound quickly if you keep building and practicing.',
    final_outcome: `You will have a much stronger profile for ${selectedRole.role_name} interviews after following the roadmap.`,
    ats_analysis: resumeFile ? {
      score: 55,
      summary: 'Resume uploaded, but ATS-specific AI analysis is unavailable right now.',
      strengths: ['Resume is available for review'],
      issues: ['Detailed ATS parsing could not be completed in fallback mode'],
      keyword_gaps: selectedRole.priority_skills.slice(0, 5),
      suggested_keywords: selectedRole.priority_skills.slice(0, 6),
      section_scores: { formatting: 60, keyword_match: 50, content_strength: 55, impact: 50 },
      rewrite_suggestions: ['Rewrite project bullets with action verbs and outcomes', 'Mirror important role keywords in the skills and projects sections']
    } : null,
    resume_meta: resumeFile ? { file_name: resumeFile.name, file_type: resumeFile.type || 'application/octet-stream' } : null
  };
};

// ----------------------------------------------------------------
// Skill-Gap Prompt Template
// ----------------------------------------------------------------
const SKILL_GAP_PROMPT = `You are a senior placement expert and technical career coach at a top Indian engineering college.

A student has provided their current skills and wants to break into a specific tech career.

STUDENT'S CURRENT SKILLS:
{{STUDENT_SKILLS}}

TARGET CAREER ROLE: {{CAREER_ROLE}}

INDUSTRY REQUIREMENTS FOR THIS ROLE:
{{INDUSTRY_SKILLS_JSON}}

Provide a comprehensive skill gap analysis in the following JSON format (return ONLY the JSON, no markdown):
{
  "career_role": "...",
  "readiness_score": 0-100,
  "score_breakdown": {
    "technical_skills": 0-100,
    "projects": 0-100,
    "interview_readiness": 0-100
  },
  "honest_assessment": "2-3 sentence honest but encouraging assessment",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "recommended_skills": ["skill1", "skill2"],
  "skill_priority_order": [
    {"skill": "...", "reason": "...", "time_to_learn": "...", "difficulty": "Easy/Medium/Hard"}
  ],
  "learning_roadmap": [
    {"month": "Month 1-2", "focus": "...", "skills": ["..."], "resources": ["..."]}
  ],
  "quick_wins": [
    {"task": "...", "time": "...", "impact": "..."}
  ],
  "resume_tips": ["tip1", "tip2"],
  "linkedin_tips": ["tip1", "tip2"],
  "motivation": "An inspiring but realistic message",
  "final_outcome": "What the student can achieve in 6 months"
}`;

export default analyzeT7LearningHub;
