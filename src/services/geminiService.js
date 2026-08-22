/**
 * Gemini AI Service
 * 
 * Handles communication with Google Gemini API for skill gap analysis.
 * Uses structured prompts to get JSON responses.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API with default key
const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const defaultGenAI = defaultApiKey ? new GoogleGenerativeAI(defaultApiKey) : null;

/**
 * Curated list of standard Gemini models used as immediate fallback
 */
export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', tag: 'High', speedLabel: 'High', isFlash: true },
  { id: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', tag: 'High Reasoning', speedLabel: 'Deep Reasoning', isPro: true },
  { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', tag: 'Fast', speedLabel: 'Fast', isFlash: true },
  { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite', tag: 'Ultra Fast', speedLabel: 'Ultra Fast', isFlash: true }
];

/**
 * Fetch real-time available Gemini models for an API key directly from Google
 * 
 * @param {string} apiKey - Optional custom API key, defaults to VITE_GEMINI_API_KEY
 * @returns {Promise<Array>} - List of formatted model objects
 */
export const fetchAvailableGeminiModels = async (apiKey = null) => {
  const activeKey = apiKey || defaultApiKey;
  if (!activeKey) return DEFAULT_GEMINI_MODELS;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch live Gemini models (${res.status}), using default catalog`);
      return DEFAULT_GEMINI_MODELS;
    }

    const data = await res.json();
    if (!data?.models || !Array.isArray(data.models)) {
      return DEFAULT_GEMINI_MODELS;
    }

    // Filter only models that support content generation and are Gemini models
    const filtered = data.models
      .filter(m => {
        const name = m.name?.toLowerCase() || '';
        const methods = m.supportedGenerationMethods || [];
        return name.includes('gemini') && 
               methods.includes('generateContent') && 
               !name.includes('vision') && // legacy vision-only
               !name.includes('embedding');
      })
      .map(m => {
        const rawId = m.name.replace(/^models\//, '');
        const isFlash = rawId.includes('flash');
        const isPro = rawId.includes('pro');
        const isHigh = rawId.includes('3.7') || rawId.includes('pro');
        
        let tag = isHigh ? 'High' : (isFlash ? 'Fast' : 'General');
        let speedLabel = isFlash ? 'Fast' : (isPro ? 'Deep Reasoning' : 'Standard');
        
        return {
          id: rawId,
          displayName: m.displayName || rawId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: m.description || '',
          tag,
          speedLabel,
          isFlash,
          isPro,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit
        };
      });

    return filtered.length > 0 ? filtered : DEFAULT_GEMINI_MODELS;
  } catch (err) {
    console.warn('Error fetching live models from Google AI:', err);
    return DEFAULT_GEMINI_MODELS;
  }
};

/**
 * Verify if a Gemini API key is valid by testing it with Google
 * 
 * @param {string} apiKey 
 * @returns {Promise<{valid: boolean, models?: Array, error?: string}>}
 */
export const verifyGeminiApiKey = async (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { valid: false, error: 'API key is too short or empty' };
  }

  const cleanKey = apiKey.trim();

  try {
    // 1. Check with models endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { 
        valid: false, 
        error: errData?.error?.message || `Google API returned status ${res.status}: Invalid API Key` 
      };
    }

    const data = await res.json();
    const liveModels = await fetchAvailableGeminiModels(cleanKey);

    return {
      valid: true,
      models: liveModels,
      totalModels: data?.models?.length || 0
    };
  } catch (err) {
    return { valid: false, error: err.message || 'Network error verifying API key' };
  }
};

/**
 * Analyze skill gap using Gemini AI
 * 
 * @param {string[]} studentSkills - Array of student's current skills
 * @param {object} selectedRole - Selected career role object
 * @param {object[]} allRoles - All industry roles for context
 * @param {File|null} resumeFile - Optional uploaded resume file
 * @param {string|null} customApiKey - Optional user's personal Gemini API key
 * @param {string|null} preferredModel - Optional preferred model id (e.g., 'gemini-3.7-flash')
 * @returns {Promise<object>} - Analysis result object
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
    // Build the prompt with actual data
    const prompt = SKILL_GAP_PROMPT
      .replace('{{STUDENT_SKILLS}}', JSON.stringify(studentSkills, null, 2))
      .replace('{{CAREER_ROLE}}', selectedRole.role_name)
      .replace('{{INDUSTRY_SKILLS_JSON}}', JSON.stringify({
        role_name: selectedRole.role_name,
        description: selectedRole.description,
        required_skills: selectedRole.required_skills,
        priority_skills: selectedRole.priority_skills
      }, null, 2));

    // Build request parts
    const requestParts = [{ text: prompt }];

    if (resumeFile) {
      requestParts.push({
        text: `The uploaded file is the student's resume. Review it for ATS performance against the selected role "${selectedRole.role_name}".`
      });
      requestParts.push(await fileToGenerativePart(resumeFile));
    }

    // Determine active API key
    const activeKey = (customApiKey && customApiKey.trim()) || defaultApiKey;
    if (!activeKey) {
      console.warn('No Gemini API key available, using local fallback analysis');
      return generateFallbackAnalysis(studentSkills, selectedRole, resumeFile);
    }

    const activeGenAI = new GoogleGenerativeAI(activeKey);

    // Build candidate model list starting with user's preferred model if provided
    const modelCandidates = [];
    if (preferredModel && preferredModel !== 'auto') {
      modelCandidates.push(preferredModel);
    }

    // Default priority fallback list
    const fallbackList = [
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];

    for (const m of fallbackList) {
      if (!modelCandidates.includes(m)) {
        modelCandidates.push(m);
      }
    }

    let result = null;
    let lastModelError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = activeGenAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(requestParts);
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (modelErr) {
        console.warn(`Model ${modelName} failed:`, modelErr.message);
        lastModelError = modelErr;
        continue;
      }
    }

    if (!result) {
      throw lastModelError || new Error('All Gemini models failed');
    }

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonText = text;
    
    // Remove markdown code blocks if present
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    // Parse and validate JSON
    const analysisResult = JSON.parse(jsonText.trim());

    // Ensure required fields exist
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
        ? {
            file_name: resumeFile.name,
            file_type: resumeFile.type || 'application/octet-stream'
          }
        : null
    };
  } catch (error) {
    console.error('Gemini API COMPLETE ERROR TRACE:', error);
    if (error.response) console.error('Response Error Data:', error.response);
    
    // Fallback: Generate basic analysis locally if API fails
    return generateFallbackAnalysis(studentSkills, selectedRole, resumeFile);
  }
};

/**
 * Perform a standalone ATS analysis against a selected career role
 */
export const analyzeResumeOnly = async (resumeFile, selectedRole, apiKey, preferredModel = null) => {
  const activeKey = apiKey || defaultApiKey;
  if (!activeKey) throw new Error('API key is required for ATS analysis');
  
  const genAI = new GoogleGenerativeAI(activeKey);
  const resumePart = await fileToGenerativePart(resumeFile);
  
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

  try {
    const modelNames = [];
    if (preferredModel && preferredModel !== 'auto') {
      modelNames.push(preferredModel);
    }
    const fallbacks = [
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];
    for (const fb of fallbacks) {
      if (!modelNames.includes(fb)) modelNames.push(fb);
    }

    let result = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`ATS Standalone trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([ prompt, resumePart ]);
        console.log(`ATS Standalone success with: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`ATS Standalone model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!result) throw lastError || new Error('All Gemini models failed for ATS');

    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error('Empty response from AI');
    
    // Parse JSON
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText.trim());
    } catch (parseErr) {
      console.warn("JSON Parse Error. AI Output was:", text);
      parsedResult = {
        score: 0,
        summary: "The uploaded document does not appear to be a valid resume or the AI rejected it.",
        strengths: [],
        issues: ["Could not extract structured data."],
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
    console.error('ATS ONLY Error:', err);
    throw err;
  }
};

/**
 * Fallback analysis when Gemini API is unavailable
 * Provides a basic skill gap analysis based on simple comparison
 */
const generateFallbackAnalysis = (studentSkills, selectedRole, resumeFile = null) => {
  const requiredSkillNames = selectedRole.required_skills.map(s => s.name);
  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  
  const matched = requiredSkillNames.filter(skill => 
    studentSkillsLower.includes(skill.toLowerCase())
  );
  
  const missing = requiredSkillNames.filter(skill => 
    !studentSkillsLower.includes(skill.toLowerCase())
  );

  // Calculate readiness score based on matched priority skills
  const priorityMatched = selectedRole.priority_skills.filter(skill =>
    studentSkillsLower.includes(skill.toLowerCase())
  );
  
  const readinessScore = Math.round(
    (matched.length / requiredSkillNames.length) * 60 +
    (priorityMatched.length / selectedRole.priority_skills.length) * 40
  );

  // Generate basic roadmap
  const roadmap = [];
  const highPriorityMissing = missing.filter(skill => 
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'high')
  );
  const mediumPriorityMissing = missing.filter(skill => 
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'medium')
  );

  if (highPriorityMissing.length > 0) {
    roadmap.push({
      month: 'Month 1-2',
      focus: 'Core Foundation Skills',
      skills: highPriorityMissing.slice(0, 3),
      resources: ['Official documentation', 'Free YouTube tutorials', 'Practice projects']
    });
  }

  if (highPriorityMissing.length > 3 || mediumPriorityMissing.length > 0) {
    roadmap.push({
      month: 'Month 3-4',
      focus: 'Intermediate Skills Development',
      skills: [...highPriorityMissing.slice(3), ...mediumPriorityMissing.slice(0, 2)],
      resources: ['Build mini-projects', 'Online coding platforms', 'Open source contributions']
    });
  }

  roadmap.push({
    month: 'Month 5-6',
    focus: 'Project Building & Interview Prep',
    skills: ['Portfolio Development', 'Interview Skills'],
    resources: ['Build 2-3 projects', 'LeetCode practice', 'Mock interviews']
  });

  return {
    career_role: selectedRole.role_name,
    readiness_score: readinessScore,
    score_breakdown: {
      technical_skills: readinessScore,
      projects: Math.max(20, readinessScore - 10),
      interview_readiness: Math.max(25, readinessScore - 5)
    },
    honest_assessment: matched.length > 0
      ? `You already have some alignment with ${selectedRole.role_name}, but there are still important gaps to close before placements.`
      : `You are still at the starting point for ${selectedRole.role_name}, so focus on the highest-priority fundamentals first.`,
    matched_skills: matched,
    missing_skills: missing,
    recommended_skills: highPriorityMissing.slice(0, 5),
    skill_priority_order: highPriorityMissing.slice(0, 5).map((skill) => ({
      skill,
      reason: 'High-priority requirement for this role',
      time_to_learn: '2-4 weeks',
      difficulty: 'Medium'
    })),
    learning_roadmap: roadmap,
    quick_wins: highPriorityMissing.slice(0, 3).map((skill) => ({
      task: `Start practicing ${skill}`,
      time: '1-2 hours',
      impact: `Improves alignment with ${selectedRole.role_name}`
    })),
    resume_tips: [
      'Use measurable impact in project bullet points',
      'Add keywords from the job role naturally in skills and projects'
    ],
    linkedin_tips: [
      `Mention your interest in ${selectedRole.role_name} clearly in the headline`,
      'Post weekly progress about projects and learning milestones'
    ],
    motivation: 'Consistent weekly effort will compound quickly if you keep building and practicing.',
    final_outcome: `You will have a much stronger profile for ${selectedRole.role_name} interviews after following the roadmap.`,
    ats_analysis: resumeFile ? {
      score: 55,
      summary: 'Resume uploaded, but ATS-specific AI analysis is unavailable right now. Use the suggestions below as a starter checklist.',
      strengths: ['Resume is available for review'],
      issues: ['Detailed ATS parsing could not be completed in fallback mode'],
      keyword_gaps: selectedRole.priority_skills.slice(0, 5),
      suggested_keywords: selectedRole.priority_skills.slice(0, 6),
      section_scores: {
        formatting: 60,
        keyword_match: 50,
        content_strength: 55,
        impact: 50
      },
      rewrite_suggestions: [
        'Rewrite project bullets with action verbs and outcomes',
        'Mirror important role keywords in the skills and projects sections'
      ]
    } : null,
    resume_meta: resumeFile ? {
      file_name: resumeFile.name,
      file_type: resumeFile.type || 'application/octet-stream'
    } : null
  };
};

export default analyzeT7LearningHub;
